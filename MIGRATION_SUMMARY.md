# Table Merge Summary: teams + team_wallets → teams

## What Changed

### Before
- **Two separate tables**: `teams` and `team_wallets`
- **Two-step creation**: Generate wallet → Create team
- **Separate databases**: Team info in one table, wallet keys in another

### After
- **One unified table**: `teams` (with both team info and wallet keys)
- **One-step creation**: Generate wallet and create team in single backend call
- **Simplified architecture**: All team data in one place with proper security

## Table Structure

### Merged `teams` Table
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    team_name TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE,      -- NEW: Solana public key
    secret_key TEXT,                 -- NEW: Solana private key (RLS-protected)
    wallet_addresses JSONB DEFAULT '[]'::jsonb,
    owner UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Security Layer: `teams_public` View
```sql
CREATE VIEW teams_public AS
SELECT 
    id,
    team_name,
    wallet_address,
    wallet_addresses,
    owner,
    created_at,
    updated_at
FROM teams;
-- Note: secret_key is EXCLUDED from this view
```

## Security Model

### RLS Policies
1. **Block direct table access**: Clients CANNOT query `teams` table directly
2. **Force view usage**: Clients MUST use `teams_public` view
3. **Backend-only access**: Only `service_role` can access `secret_key`
4. **No client writes**: Only backend can insert/update teams

### What This Prevents
- ❌ Client-side access to private keys
- ❌ Accidental secret_key exposure in queries
- ❌ Direct database manipulation from frontend
- ✅ Backend maintains full control of sensitive data

## Flow Changes

### Old Flow (Two Steps)
```
Frontend → Generate Wallet API → Backend creates wallet in team_wallets
Frontend → Insert into teams table with wallet_address
```

### New Flow (One Step)
```
Frontend → Generate Wallet API (with teamName, owner)
         ↓
Backend creates team in teams table with:
  - wallet_address (public)
  - secret_key (private)
         ↓
Returns only public address to frontend
```

## Files Changed

### Migration Files
- ✏️ `migrations/002_create_teams_table.sql` - Added secret_key, RLS policies, teams_public view
- ✏️ `migrations/003_create_team_members_table.sql` - Moved trigger here (after team_members exists)

### Backend Files
- ✏️ `backend/supabase.ts` - Changed from team_wallets to teams table
- ✏️ `backend/index.tsx` - Accepts teamName and owner in wallet generation
- ✏️ `backend/migrations/002_create_team_wallets_table.sql` - Marked as deprecated

### Frontend Files
- ✏️ `app/api/wallet/generate/route.ts` - Passes teamName and owner to backend
- ✏️ `app/components/TeamForm.tsx` - Single API call for team creation, uses teams_public view

### Documentation
- ✏️ `README.md` - Updated architecture explanation
- ✏️ `WALLET_INTEGRATION.md` - Updated schema and flow diagrams
- 📄 `MIGRATION_SUMMARY.md` - This file

## How to Apply to Existing Database

### Option 1: Run Fix Script (Recommended)
1. Open your Supabase project → SQL Editor
2. Copy contents of `migrations/fix_team_creation.sql`
3. Run the script
4. Verify: Try creating a team!

### Option 2: Fresh Migration
If you're in development and can reset:
1. Drop all tables
2. Run migrations in order:
   - `001_create_users_table.sql`
   - `002_create_teams_table.sql`
   - `003_create_team_members_table.sql`

## Testing

### Test Team Creation
```bash
# 1. Start backend
pnpm run dev:backend

# 2. Start frontend
pnpm dev

# 3. Navigate to app and create a team
# Should see: ✅ Team "[name]" created with wallet: [address]
```

### Verify Security
```javascript
// This should work (using view)
const { data } = await supabase.from('teams_public').select('*');
console.log(data); // ✅ No secret_key in results

// This should fail (blocked by RLS)
const { data, error } = await supabase.from('teams').select('*');
console.log(error); // ❌ Access denied
```

## Benefits

### Architecture
- ✅ Simpler data model (one table instead of two)
- ✅ Atomic team creation (no race conditions)
- ✅ Single source of truth

### Security
- ✅ Stronger RLS policies
- ✅ Impossible to accidentally expose secret_key
- ✅ Clear separation via view

### Developer Experience
- ✅ One API call instead of two
- ✅ Less code to maintain
- ✅ Clearer data flow

## Rollback Plan

If you need to revert to the old structure:

```sql
-- 1. Create team_wallets table
CREATE TABLE team_wallets (
    id UUID PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    secret_key TEXT NOT NULL,
    team_id UUID,
    team_name TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. Migrate data from teams to team_wallets
INSERT INTO team_wallets (wallet_address, secret_key, team_id, team_name)
SELECT wallet_address, secret_key, id, team_name FROM teams
WHERE wallet_address IS NOT NULL;

-- 3. Remove columns from teams
ALTER TABLE teams DROP COLUMN secret_key;
```

## Questions?

If you encounter any issues:
1. Check that backend is running on port 3001
2. Verify Supabase connection (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
3. Ensure migrations ran successfully
4. Check browser console for errors

