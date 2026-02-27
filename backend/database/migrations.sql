-- =====================================================
-- Cyber Knights - Supabase Database Migration Script
-- Run this in: Supabase Dashboard -> SQL Editor
-- =====================================================

-- 1. Scan Reports Table
CREATE TABLE IF NOT EXISTS scan_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT,
  file_hash TEXT NOT NULL,
  file_size_kb INTEGER DEFAULT 0,
  permission_count INTEGER DEFAULT 0,
  malware_match BOOLEAN DEFAULT false,
  malware_name TEXT,
  url_count INTEGER DEFAULT 0,
  api_count INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  classification TEXT CHECK (classification IN ('Safe', 'Medium Risk', 'High Risk')),
  permissions JSONB DEFAULT '[]',
  urls JSONB DEFAULT '[]',
  suspicious_apis JSONB DEFAULT '[]',
  sensitive_data JSONB DEFAULT '[]',
  scan_type TEXT DEFAULT 'apk' CHECK (scan_type IN ('apk', 'url')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Malware Signatures Table
CREATE TABLE IF NOT EXISTS malware_signatures (
  signature_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sha256_hash TEXT UNIQUE NOT NULL,
  threat_name TEXT NOT NULL,
  threat_type TEXT DEFAULT 'malware',
  severity TEXT DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. URL Scans Table
CREATE TABLE IF NOT EXISTS url_scans (
  scan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_safe BOOLEAN DEFAULT true,
  threat_type TEXT,
  threat_level TEXT DEFAULT 'safe' CHECK (threat_level IN ('safe', 'suspicious', 'malicious')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE scan_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE malware_signatures ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can only read their own scan reports
CREATE POLICY "Users can read own scan_reports"
  ON scan_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan_reports"
  ON scan_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- URL scans: users can read/insert their own
CREATE POLICY "Users can read own url_scans"
  ON url_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own url_scans"
  ON url_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Malware signatures: readable by all authenticated users
CREATE POLICY "Authenticated users can read signatures"
  ON malware_signatures FOR SELECT
  TO authenticated
  USING (true);

-- 6. Seed known malware signatures (SHA-256 of known bad APKs)
INSERT INTO malware_signatures (sha256_hash, threat_name, threat_type, severity, description) VALUES
  ('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'Joker.SMS.Trojan', 'trojan', 'critical', 'SMS fraud Trojan that subscribes users to premium services'),
  ('deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', 'BankBot.Android', 'banking_trojan', 'critical', 'Banking Trojan targeting credentials'),
  ('cafebabe00000000cafebabe00000000cafebabe00000000cafebabe00000000', 'Cerberus.Spyware', 'spyware', 'high', 'Spyware with keylogging capabilities'),
  ('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'FakeBank.Phishing', 'phishing', 'high', 'Fake banking app for credential theft'),
  ('aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899', 'HiddenAds.Adware', 'adware', 'medium', 'Hidden adware running in background')
ON CONFLICT (sha256_hash) DO NOTHING;

-- 7. Create admin role (optional - set in Supabase dashboard)
-- UPDATE auth.users SET raw_app_meta_data = '{"role": "admin"}' WHERE email = 'admin@cyberknights.io';
