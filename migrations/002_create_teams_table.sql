-- Create teams table for team management (merged with team_wallets)
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_name TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE,
    secret_key TEXT,
    wallet_addresses JSONB DEFAULT '[]'::jsonb,
    owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on team_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_wallet_address ON teams(wallet_address);

-- Create GIN index on wallet_addresses JSONB for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_wallet_addresses ON teams USING GIN (wallet_addresses);

-- Create index on owner for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- CRITICAL SECURITY: Create a public view that exposes only safe, non-sensitive fields
-- This is what clients can query using the anon key
CREATE OR REPLACE VIEW teams_public AS
SELECT 
    id,
    team_name,
    wallet_address,
    wallet_addresses,
    owner,
    created_at,
    updated_at
FROM teams;

-- Grant SELECT access to the public view for anon/authenticated users
GRANT SELECT ON teams_public TO anon;
GRANT SELECT ON teams_public TO authenticated;

-- CRITICAL SECURITY: Block ALL direct access to teams table from anon/authenticated roles
-- Only the service_role (backend) can access the secret_key
-- This prevents ANY client-side access to secret_key even if they query the table directly

-- Block all direct SELECT access from anon/authenticated - they must use teams_public view
CREATE POLICY "Block direct table access" ON teams
    FOR SELECT TO anon, authenticated USING (false);

-- Allow service role to insert teams (for team creation via backend)
CREATE POLICY "Allow team creation via service" ON teams
    FOR INSERT WITH CHECK (true);

-- Block inserts from anon/authenticated - only service role can insert
CREATE POLICY "Block anon insert" ON teams
    FOR INSERT TO anon, authenticated WITH CHECK (false);

-- Block updates from anon/authenticated - only service role can update
CREATE POLICY "Block anon update" ON teams
    FOR UPDATE TO anon, authenticated USING (false);

-- Prevent team deletion from all roles
CREATE POLICY "Prevent team deletion" ON teams
    FOR DELETE USING (false);

-- Function to check team name uniqueness (case-insensitive)
CREATE OR REPLACE FUNCTION check_team_name_unique(new_team_name TEXT, team_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF new_team_name IS NULL OR trim(new_team_name) = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if team name already exists (case-insensitive), excluding current team
    IF EXISTS (
        SELECT 1 FROM teams 
        WHERE LOWER(team_name) = LOWER(trim(new_team_name)) 
        AND (team_id IS NULL OR id != team_id)
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
