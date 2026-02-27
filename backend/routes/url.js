const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { scanUrl } = require('../services/urlScanner');
const { supabaseAdmin } = require('../database/supabase');

// POST /api/url/scan
router.post('/scan', authMiddleware, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        // Validate URL format
        try { new URL(url); } catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const scanResult = await scanUrl(url);

        // Save to database
        const { data: savedScan, error: dbError } = await supabaseAdmin
            .from('url_scans')
            .insert({
                user_id: req.userId,
                url: scanResult.url,
                is_safe: scanResult.isSafe,
                threat_type: scanResult.threatType,
                threat_level: scanResult.threatLevel,
                details: scanResult.details,
            })
            .select()
            .single();

        if (dbError) console.error('URL scan DB error:', dbError);

        res.json({
            success: true,
            scanId: savedScan?.scan_id || null,
            result: scanResult
        });
    } catch (err) {
        console.error('URL scan error:', err);
        res.status(500).json({ error: 'URL scan failed: ' + err.message });
    }
});

// GET /api/url/history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { data, error, count } = await supabaseAdmin
            .from('url_scans')
            .select('*', { count: 'exact' })
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) throw error;

        res.json({ scans: data || [], total: count || 0, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch URL scan history' });
    }
});

module.exports = router;
