-- Add slug functionality to teams table
-- This migration adds the slug column for team URL routing
-- Slug generation is handled by the API route, not the database

-- Add slug column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE NOT NULL;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
