const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if we have the minimum requirements for Supabase
const hasBaseConfig = supabaseUrl && !supabaseUrl.includes('your-project');

if (!hasBaseConfig) {
    console.warn('⚠️  CYBER KNIGHTS: Missing or default SUPABASE_URL. Auth will likely fail.');
}

// Service client (admin operations like password resets)
const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || 'placeholder-key'
);

// Public client (user-facing operations)
const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

module.exports = { supabase, supabaseAdmin, isDemoMode: !hasBaseConfig };
