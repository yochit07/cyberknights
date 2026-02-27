const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../database/supabase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName || '' } }
        });

        if (error) return res.status(400).json({ error: error.message });

        res.status(201).json({
            message: 'Registration successful. Check your email to confirm your account.',
            user: { id: data.user?.id, email: data.user?.email }
        });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) return res.status(401).json({ error: error.message });

        res.json({
            message: 'Login successful',
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            user: {
                id: data.user.id,
                email: data.user.email,
                fullName: data.user.user_metadata?.full_name || '',
                role: data.user.app_metadata?.role || 'user',
                createdAt: data.user.created_at,
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        await supabase.auth.signOut();
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/reset-password`
        });

        if (error) return res.status(400).json({ error: error.message });

        res.json({ message: 'Password reset email sent. Check your inbox.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send reset email' });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
        if (error) return res.status(401).json({ error: 'Invalid refresh token' });

        res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token });
    } catch (err) {
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

module.exports = router;
