"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createSupabaseBrowserClient, User } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';
import { useWalletVerification } from '@/hooks/useWalletVerification';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithWallet: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, connected } = useWallet();
  const { verifyUsernameChange } = useWalletVerification();
  const supabase = createSupabaseBrowserClient();

  // Check if user exists or create new user
  const handleUserAuth = async (walletAddress: string) => {
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
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  // Sign in with wallet
  const signInWithWallet = async () => {
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
  };

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

  // Update username with wallet signature verification
  const updateUsername = async (username: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      // Trim and validate username
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        throw new Error('Username cannot be empty');
      }

      // Check if this is already their current username
      if (user.username && user.username.toLowerCase() === trimmedUsername.toLowerCase()) {
        throw new Error('This is already your current username');
      }

      // Check if username is available
      const isAvailable = await checkUsernameAvailable(trimmedUsername);
      if (!isAvailable) {
        throw new Error('Username is already taken');
      }

      // Verify wallet ownership with signature
      await verifyUsernameChange(trimmedUsername);

      // Update username in database
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ username: trimmedUsername })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setUser(updatedUser);
    } catch (err) {
      console.error('Error updating username:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update username';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Check if username is available
  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    try {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) return false;

      const { data, error } = await supabase
        .from('users')
        .select('id')
        .ilike('username', trimmedUsername)
        .neq('id', user?.id || '');

      if (error) {
        console.error('Error checking username availability:', error);
        return false;
      }

      return data.length === 0;
    } catch (err) {
      console.error('Error checking username availability:', err);
      return false;
    }
  };

  // Auto-authenticate when wallet connects/disconnects or switches
  useEffect(() => {
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
  }, [connected, publicKey, user]);

  // Initial loading state
  useEffect(() => {
    if (!connected) {
      setLoading(false);
    }
  }, [connected]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithWallet,
    signOut,
    updateUsername,
    checkUsernameAvailable,
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
