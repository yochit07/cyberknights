const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../database/supabase');

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats — platform-wide stats
router.get('/stats', async (req, res) => {
    try {
        const { count: totalScans } = await supabaseAdmin.from('scan_reports').select('*', { count: 'exact', head: true });
        const { count: totalUsers } = await supabaseAdmin.from('scan_reports').select('user_id', { count: 'exact', head: true });
        const { count: malwareFound } = await supabaseAdmin.from('scan_reports').select('*', { count: 'exact', head: true }).eq('malware_match', true);
        const { count: totalSignatures } = await supabaseAdmin.from('malware_signatures').select('*', { count: 'exact', head: true });
        const { count: urlScans } = await supabaseAdmin.from('url_scans').select('*', { count: 'exact', head: true });

        res.json({ totalScans, totalUsers, malwareFound, totalSignatures, urlScans });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// GET /api/admin/scans — all scans
router.get('/scans', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { data, error, count } = await supabaseAdmin
            .from('scan_reports')
            .select('report_id, user_id, file_name, risk_score, classification, malware_match, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) throw error;
        res.json({ scans: data || [], total: count || 0 });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch scans' });
    }
});

// GET /api/admin/signatures — list malware signatures
router.get('/signatures', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('malware_signatures')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ signatures: data || [] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch signatures' });
    }
});

// POST /api/admin/signatures — add new signature
router.post('/signatures', async (req, res) => {
    try {
        const { sha256Hash, threatName, threatType = 'malware', severity = 'high', description } = req.body;
        if (!sha256Hash || !threatName) return res.status(400).json({ error: 'sha256Hash and threatName required' });
        if (!/^[a-f0-9]{64}$/i.test(sha256Hash)) return res.status(400).json({ error: 'Invalid SHA-256 hash format' });

        const { data, error } = await supabaseAdmin
            .from('malware_signatures')
            .insert({ sha256_hash: sha256Hash.toLowerCase(), threat_name: threatName, threat_type: threatType, severity, description })
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json({ message: 'Signature added', signature: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add signature' });
    }
});

// DELETE /api/admin/signatures/:id
router.delete('/signatures/:id', async (req, res) => {
    try {
        const { error } = await supabaseAdmin.from('malware_signatures').delete().eq('signature_id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Signature deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete signature' });
    }
});

module.exports = router;
