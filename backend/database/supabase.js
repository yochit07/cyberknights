const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const isDemoMode = !supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('your-project');

if (isDemoMode) {
    console.warn('⚠️  CYBER KNIGHTS: Running in DEMO MODE (Supabase credentials missing or default)');
}

// Service client (admin operations)
const supabaseAdmin = createClient(
    isDemoMode ? 'https://placeholder.supabase.co' : supabaseUrl,
    isDemoMode ? 'placeholder-key' : supabaseServiceKey
);

// Public client (user-facing operations)
const supabase = createClient(
    isDemoMode ? 'https://placeholder.supabase.co' : supabaseUrl,
    isDemoMode ? 'placeholder-key' : supabaseAnonKey
);

module.exports = { supabase, supabaseAdmin, isDemoMode };
