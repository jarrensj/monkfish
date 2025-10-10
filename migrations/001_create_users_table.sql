-- Create users table for wallet-based authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    secret_key TEXT NOT NULL,
    username TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Create index on username for faster lookups and uniqueness checks
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- CRITICAL SECURITY: Block ALL direct access to users table from anon/authenticated roles
-- Only the service_role (backend) can access the secret_key
-- This prevents ANY client-side access to secret_key even if they query the table directly
-- Note: Service role automatically bypasses RLS, so these policies only affect anon/authenticated users

-- Block all direct SELECT access from anon key (clients can only use the public view below)
-- Service role can still SELECT (bypasses RLS)
CREATE POLICY "Block direct table access" ON users
    FOR SELECT TO anon, authenticated USING (false);

-- Block inserts from anon/authenticated - only service role can insert
CREATE POLICY "Block anon insert" ON users
    FOR INSERT TO anon, authenticated WITH CHECK (false);

-- Block updates from anon/authenticated - only service role can update
CREATE POLICY "Block anon update" ON users
    FOR UPDATE TO anon, authenticated USING (false);

-- Block all deletions from anon/authenticated
CREATE POLICY "Block anon delete" ON users
    FOR DELETE TO anon, authenticated USING (false);

-- Create a PUBLIC VIEW that exposes only safe, non-sensitive fields
-- This is what clients can query using the anon key
CREATE OR REPLACE VIEW users_public AS
SELECT 
    id,
    wallet_address,
    username,
    created_at,
    updated_at
FROM users;

-- Grant SELECT access to the public view for anon users
GRANT SELECT ON users_public TO anon;
GRANT SELECT ON users_public TO authenticated;

-- Function to check username uniqueness (case-insensitive)
CREATE OR REPLACE FUNCTION check_username_unique(new_username TEXT, user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF new_username IS NULL OR trim(new_username) = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if username already exists (case-insensitive), excluding current user
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE LOWER(username) = LOWER(trim(new_username)) 
        AND (user_id IS NULL OR id != user_id)
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
