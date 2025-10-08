-- Create users table for wallet-based authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
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

-- Create policies that work with wallet-based authentication
-- Allow anyone to insert new users (wallet-based registration)
CREATE POLICY "Allow wallet user creation" ON users
    FOR INSERT WITH CHECK (true);

-- Allow anyone to read user data (needed for username checks and profile display)
CREATE POLICY "Allow reading user profiles" ON users
    FOR SELECT USING (true);

-- Allow users to update their own records (we'll add wallet verification later)
CREATE POLICY "Allow user updates" ON users
    FOR UPDATE USING (true);

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
