const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateReportText } = require('../services/reportGenerator');
const { supabaseAdmin } = require('../database/supabase');

// GET /api/reports — paginated scan history
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, type } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin
            .from('scan_reports')
            .select('*', { count: 'exact' })
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (type) query = query.eq('scan_type', type);

        const { data, error, count } = await query;
        if (error) throw error;

        res.json({ reports: data || [], total: count || 0, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// GET /api/reports/stats — dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const { data: reports, error } = await supabaseAdmin
            .from('scan_reports')
            .select('classification, risk_score, created_at, malware_match')
            .eq('user_id', req.userId);

        if (error) throw error;

        const total = reports?.length || 0;
        const safe = reports?.filter(r => r.classification === 'Safe').length || 0;
        const medium = reports?.filter(r => r.classification === 'Medium Risk').length || 0;
        const high = reports?.filter(r => r.classification === 'High Risk').length || 0;
        const malwareFound = reports?.filter(r => r.malware_match).length || 0;
        const avgScore = total > 0 ? Math.round(reports.reduce((s, r) => s + r.risk_score, 0) / total) : 0;

        // Last 7 days trend
        const now = new Date();
        const trend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = reports?.filter(r => r.created_at?.startsWith(dateStr)).length || 0;
            trend.push({ date: dateStr, count });
        }

        res.json({ total, safe, medium, high, malwareFound, avgScore, trend });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/reports/:id — single report
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('scan_reports')
            .select('*')
            .eq('report_id', req.params.id)
            .eq('user_id', req.userId)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Report not found' });
        res.json({ report: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

// GET /api/reports/:id/download — download report as text file
router.get('/:id/download', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('scan_reports')
            .select('*')
            .eq('report_id', req.params.id)
            .eq('user_id', req.userId)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Report not found' });

        const reportText = generateReportText(data);
        const filename = `CyberKnights_Report_${req.params.id.slice(0, 8)}.txt`;

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(reportText);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate report download' });
    }
});

// DELETE /api/reports/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('scan_reports')
            .delete()
            .eq('report_id', req.params.id)
            .eq('user_id', req.userId);

        if (error) throw error;
        res.json({ message: 'Report deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete report' });
    }
});

module.exports = router;
