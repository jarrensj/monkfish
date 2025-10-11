import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUserOperations } from './useUserOperations';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export function useUserProfile() {
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, setUser } = useAuth();
  const { verifyUsernameChange } = useUserOperations();
  const supabase = createSupabaseBrowserClient();

  /**
   * Check if username is available
   * @param username - Username to check
   * @returns Promise<boolean> - True if available
   */
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

  /**
   * Update username with wallet signature verification
   * @param username - New username
   */
  const updateUsername = async (username: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      setIsUpdating(true);
      
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

      // Update user in auth context
      setUser(updatedUser);
    } catch (err) {
      console.error('Error updating username:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update username';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateUsername,
    checkUsernameAvailable,
    isUpdating,
    error,
  };
}
