# Team Wallet Integration

This document describes the team wallet generation feature that was implemented.

## Overview

When a user creates a team, a Solana wallet is automatically generated and associated with that team. The wallet generation is handled by a separate backend service that securely stores the private keys.

## Architecture

### Components

1. **Backend Service** (Submodule: `backend/`)
   - Generates Solana keypairs using `@solana/web3.js`
   - Stores private keys securely in Supabase
   - Exposes REST API for wallet generation
   - Repository: https://github.com/jsantibout/monkfish-backend

2. **Next.js API Route** (`app/api/wallet/generate/route.ts`)
   - Proxies requests from frontend to backend service
   - Environment variable: `WALLET_BACKEND_URL` (default: http://localhost:3001)

3. **Team Form** (`app/components/TeamForm.tsx`)
   - Calls wallet generation API when creating a team
   - Stores wallet address in team record

4. **Database** (Supabase)
   - `teams` table stores both public wallet_address and encrypted secret_key
   - `teams_public` view exposes only safe fields (excludes secret_key)
   - RLS policies prevent client access to secret_key

## Flow

```
User clicks "Create Team"
        ↓
TeamForm.handleSubmit()
        ↓
POST /api/wallet/generate (with teamName, owner)
        ↓
Backend generates Solana keypair
        ↓
Backend creates team in Supabase with:
  - wallet_address (public)
  - secret_key (private, RLS-protected)
        ↓
Public address → Returns to frontend
        ↓
Success! Team created with wallet
```

## Security

### ✅ What's Secure

- Private keys stored in `teams.secret_key` column (backend-only access)
- Backend uses `SUPABASE_SERVICE_ROLE_KEY` (not exposed to frontend)
- RLS policies block ALL client access to secret_key
- Frontend queries `teams_public` view (excludes secret_key)
- API route acts as proxy (no direct backend access from client)

### ⚠️ Production Considerations

1. **Authentication**: Add auth middleware to wallet generation endpoint
2. **Rate Limiting**: Prevent abuse of wallet generation
3. **Encryption**: Consider additional encryption for private keys at application level
4. **Audit Logging**: Log all wallet generation events
5. **Backup**: Implement secure backup strategy for private keys

## Files Changed

### New Files
- `app/api/wallet/generate/route.ts` - API route for wallet generation
- `backend/` - Git submodule for wallet service
- `.gitmodules` - Git submodule configuration
- `WALLET_INTEGRATION.md` - This documentation
- `migrations/fix_team_creation.sql` - Migration script to update existing databases

### Modified Files
- `app/components/TeamForm.tsx` - Wallet generation with team creation in one call
- `migrations/002_create_teams_table.sql` - Added `wallet_address` and `secret_key` fields, RLS policies
- `migrations/003_create_team_members_table.sql` - Added team owner auto-insert trigger
- `backend/supabase.ts` - Updated to use merged teams table
- `backend/index.tsx` - Accepts team info in wallet generation
- `backend/README.md` - Updated documentation
- `README.md` - Updated setup instructions
- `package.json` - Added helper scripts

## Usage

### Creating a Team

```typescript
// In TeamForm.tsx
const handleSubmit = async () => {
  // Generate wallet and create team in one backend call
  const walletResponse = await fetch('/api/wallet/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamName: teamName.trim(),
      owner: user.id,
    }),
  });
  const walletData = await walletResponse.json();
  // Team is now created with wallet - done!
};
```

### Retrieving Team Wallet

```typescript
const { data: team } = await supabase
  .from("teams")
  .select("wallet_address")
  .eq("id", teamId)
  .single();

console.log("Team wallet:", team.wallet_address);
```

## Database Schema

### teams Table (Merged)

The `teams` table now stores both team information and wallet keys:

```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    team_name TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE,  -- Solana public key
    secret_key TEXT,             -- Solana private key (RLS-protected)
    wallet_addresses JSONB,      -- Additional wallets if needed
    owner UUID REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### teams_public View (Safe for Client Access)

Clients query this view instead of the table directly:

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
-- Note: secret_key is excluded!
```

### Security (RLS Policies)

```sql
-- Block ALL direct client access to teams table
CREATE POLICY "Block direct table access" ON teams
    FOR SELECT TO anon, authenticated USING (false);

-- Only service_role (backend) can access teams table
-- Clients must use teams_public view
```

## Environment Variables

### Frontend (.env.local)
```bash
WALLET_BACKEND_URL=http://localhost:3001
```

### Backend (backend/.env)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
```

## Running the System

```bash
# Terminal 1 - Start backend
pnpm run dev:backend

# Terminal 2 - Start frontend
pnpm dev
```

## Future Enhancements

1. **Multi-signature wallets**: Support multiple signers for team wallets
2. **Wallet recovery**: Implement secure recovery mechanism
3. **Transaction signing**: Add endpoints for signing transactions with team wallet
4. **Wallet permissions**: Role-based access to wallet operations
5. **Hardware wallet integration**: Support hardware wallets for team owners

