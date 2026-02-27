const { supabaseAdmin } = require('../database/supabase');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        req.userId = user.id;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

const adminMiddleware = (req, res, next) => {
    const role = req.user?.app_metadata?.role || req.user?.user_metadata?.role;
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };
