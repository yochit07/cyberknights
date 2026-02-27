const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/authMiddleware');
const { analyzeApk } = require('../services/apkAnalyzer');
const { buildRiskBreakdown } = require('../services/riskEngine');
const { supabaseAdmin } = require('../database/supabase');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (ext === '.apk' || mime === 'application/vnd.android.package-archive' ||
        mime === 'application/octet-stream' || mime === 'application/zip') {
        cb(null, true);
    } else {
        cb(new Error('Only .apk files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 }
});

// POST /api/apk/upload
router.post('/upload', authMiddleware, upload.single('apk'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No APK file uploaded' });

    const filePath = req.file.path;

    try {
        // 1. Run static analysis
        const analysis = await analyzeApk(filePath);

        if (analysis.error) {
            fs.unlinkSync(filePath);
            return res.status(422).json({ error: analysis.error });
        }

        // 2. Check malware signature database
        let malwareMatch = false;
        let malwareName = null;
        const { data: sigData } = await supabaseAdmin
            .from('malware_signatures')
            .select('threat_name, severity')
            .eq('sha256_hash', analysis.fileHash)
            .single();

        if (sigData) {
            malwareMatch = true;
            malwareName = sigData.threat_name;
        }

        // 3. Compute risk score
        const P = analysis.dangerousPermissionCount;
        const M = malwareMatch ? 1 : 0;
        const U = analysis.embeddedUrls.length;
        const A = analysis.suspiciousApis.length;
        const riskResult = buildRiskBreakdown({ P, M, U, A });

        // 4. Save report to Supabase
        const reportPayload = {
            user_id: req.userId,
            file_name: req.file.originalname,
            file_hash: analysis.fileHash,
            file_size_kb: analysis.fileSizeKb,
            permission_count: P,
            malware_match: malwareMatch,
            malware_name: malwareName,
            url_count: U,
            api_count: A,
            risk_score: riskResult.score,
            classification: riskResult.classification,
            permissions: analysis.permissions,
            urls: analysis.embeddedUrls,
            suspicious_apis: analysis.suspiciousApis,
            sensitive_data: analysis.sensitiveData,
            scan_type: 'apk',
        };

        const { data: reportData, error: dbError } = await supabaseAdmin
            .from('scan_reports')
            .insert(reportPayload)
            .select()
            .single();

        if (dbError) {
            console.error('DB insert error:', dbError);
        }

        // 5. Clean up uploaded file
        try { fs.unlinkSync(filePath); } catch (_) { }

        // 6. Return full analysis result
        res.json({
            success: true,
            reportId: reportData?.report_id || null,
            analysis: {
                fileName: req.file.originalname,
                fileHash: analysis.fileHash,
                fileSizeKb: analysis.fileSizeKb,
                permissions: analysis.permissions,
                dangerousPermissionCount: P,
                malwareMatch,
                malwareName,
                embeddedUrls: analysis.embeddedUrls,
                suspiciousApis: analysis.suspiciousApis,
                sensitiveData: analysis.sensitiveData,
                risk: riskResult,
            }
        });

    } catch (err) {
        try { fs.unlinkSync(filePath); } catch (_) { }
        console.error('APK upload error:', err);
        res.status(500).json({ error: 'APK analysis failed: ' + err.message });
    }
});

// GET /api/apk/dangerous-permissions
router.get('/dangerous-permissions', (req, res) => {
    const { DANGEROUS_PERMISSIONS } = require('../services/apkAnalyzer');
    res.json({ permissions: DANGEROUS_PERMISSIONS });
});

module.exports = router;
