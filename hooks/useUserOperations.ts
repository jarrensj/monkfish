import { useWalletVerification } from './useWalletVerification';
import { WalletVerificationService } from '@/lib/walletVerification';

export function useUserOperations() {
  const { verifyOwnership, isWalletReady, walletAddress } = useWalletVerification();

  /**
   * Verify ownership for username changes
   * @param newUsername - The new username
   * @returns Promise<Uint8Array> - The signature
   */
  const verifyUsernameChange = async (newUsername: string): Promise<Uint8Array> => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    const options = WalletVerificationService.createUsernameChangeMessage(
      newUsername,
      walletAddress
    );

    return verifyOwnership(options);
  };

  return {
    verifyUsernameChange,
    isWalletReady,
  };
}
