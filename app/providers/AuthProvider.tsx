"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createSupabaseBrowserClient, User } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithWallet: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

interface ErrorWithDetails {
  message?: string;
  code?: string;
  details?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { publicKey, connected } = useWallet();
  const supabase = createSupabaseBrowserClient();

  // Check if user exists or create new user
  const handleUserAuth = useCallback(async (walletAddress: string) => {
    try {
      setError(null);
      
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError;
      }

      if (existingUser) {
        // User exists, sign them in
        setUser(existingUser);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ wallet_address: walletAddress }])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setUser(newUser);
      }
    } catch (err) {
      console.error('Error handling user auth:', err);
      // Extract error details for better debugging
      const errorWithDetails = err as ErrorWithDetails;
      const errorMsg = err && typeof err === 'object' && 'message' in err 
        ? errorWithDetails.message 
        : err instanceof Error ? err.message : 'Authentication failed';
      console.error('Error details:', { message: errorMsg, code: errorWithDetails?.code, details: errorWithDetails?.details });
      setError(errorMsg || 'Authentication failed');
    }
  }, [supabase]);

  // Sign in with wallet
  const signInWithWallet = useCallback(async () => {
    if (!publicKey || !connected) {
      setError('Wallet not connected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const walletAddress = publicKey.toBase58();
      await handleUserAuth(walletAddress);
    } catch (err) {
      console.error('Error signing in with wallet:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected, handleUserAuth]);

  // Sign out
  const signOut = async () => {
    try {
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };


  // Set mounted state on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-authenticate when wallet connects/disconnects or switches
  useEffect(() => {
    if (!mounted) return;
    
    if (connected && publicKey) {
      const currentWalletAddress = publicKey.toBase58();
      
      // If no user is signed in, sign them in
      if (!user) {
        signInWithWallet();
      } 
      // If user is signed in but wallet address changed (wallet switch), clear user and re-authenticate
      else if (user.wallet_address !== currentWalletAddress) {
        setUser(null);
        setError(null);
        signInWithWallet();
      }
    } else if (!connected && user) {
      // Wallet disconnected, sign out user
      setUser(null);
      setError(null);
    }
  }, [mounted, connected, publicKey, user, signInWithWallet]);

  // Initial loading state
  useEffect(() => {
    if (!mounted) return;
    
    if (!connected) {
      setLoading(false);
    }
  }, [mounted, connected]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithWallet,
    signOut,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
