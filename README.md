# Monkfish

A Next.js application with Solana wallet integration and team management features.

## Features

- 🔐 Solana wallet authentication
- 👥 Team creation and management
- 💰 Automatic wallet generation for teams
- 🗄️ Supabase backend integration

## Project Structure

This project uses a git submodule for the backend wallet generation service:
- `backend/` - Wallet generation service (submodule: [monkfish-backend](https://github.com/jsantibout/monkfish-backend))
- `app/` - Next.js frontend application
- `migrations/` - Database migration files

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd monkfish
pnpm run submodule:init
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Wallet Backend URL (default: http://localhost:3001)
WALLET_BACKEND_URL=http://localhost:3001
```

Create a `.env` file in the `backend/` directory:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3001
```

> ⚠️ **Security Note**: Never commit `.env` files or expose your `SUPABASE_SERVICE_ROLE_KEY` to the frontend!

### 3. Database Setup

Run the migrations in your Supabase SQL Editor:

**Main App Migrations:**
1. `migrations/001_create_users_table.sql`
2. `migrations/002_create_teams_table.sql`
3. `migrations/003_create_team_members_table.sql`

**Note:** Team wallet information (wallet_address and secret_key) is now stored directly in the `teams` table for simplified architecture.

### 4. Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
pnpm run backend:install
```

### 5. Run the Development Servers

You need to run both servers simultaneously:

**Terminal 1 - Backend (Wallet Service):**
```bash
pnpm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

> 💡 **Tip**: The backend runs on port 3001 by default, and the frontend on port 3000.

## How It Works

### Team Wallet Generation

When a user creates a team:

1. The frontend calls `/api/wallet/generate` with team name and owner
2. The Next.js API route proxies the request to the backend wallet service
3. The backend generates a Solana keypair using `@solana/web3.js`
4. The backend creates the team with wallet_address and secret_key in the `teams` table
5. The private key (secret_key) is protected by RLS policies - only service_role can access it
6. Only the public address is returned to the frontend

### Architecture

```
User → Frontend (Next.js) → API Route → Backend Service → Supabase
                                             ↓
                                        Wallet Generation
                                        (Solana Keypair)
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
