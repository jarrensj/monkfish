-- Create team_members table for team membership management
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only be in a team once
    UNIQUE(team_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow reading team memberships" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Allow joining teams" ON team_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow leaving teams" ON team_members
    FOR DELETE USING (true);

CREATE POLICY "Allow role updates" ON team_members
    FOR UPDATE USING (true);

-- Function to automatically add team owner to team_members
-- Note: This is defined here because it depends on team_members table existing
CREATE OR REPLACE FUNCTION add_team_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the team owner as owner in team_members table
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (NEW.id, NEW.owner, 'owner');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically add team owner to team_members after team creation
-- Note: This must be created AFTER team_members table exists
CREATE TRIGGER add_team_owner_trigger
    AFTER INSERT ON teams
    FOR EACH ROW
    EXECUTE FUNCTION add_team_owner_as_member();