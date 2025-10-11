
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client for client-side operations
export const createSupabaseBrowserClient = () => 
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface WalletAddress {
  chain: string
  address: string
}

export interface User {
  id: string
  wallet_address: string
  username?: string
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  team_name: string
  wallet_addresses?: WalletAddress[]
  owner: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}