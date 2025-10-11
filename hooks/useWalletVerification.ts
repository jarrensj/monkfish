import { useWallet } from '@solana/wallet-adapter-react';
import { WalletVerificationService, VerificationOptions } from '@/lib/walletVerification';

export function useWalletVerification() {
  const { publicKey, connected, signMessage } = useWallet();

  /**
   * Verify wallet ownership with signature
   * @param options - Verification options
   * @returns Promise<Uint8Array> - The signature
   */
  const verifyOwnership = async (options: VerificationOptions): Promise<Uint8Array> => {
    if (!publicKey || !connected || !signMessage) {
      throw new Error('Wallet not connected or does not support signing');
    }

    return WalletVerificationService.verifyOwnership(
      { publicKey, signMessage },
      options
    );
  };

  /**
   * Verify ownership for username changes
   * @param newUsername - The new username
   * @returns Promise<Uint8Array> - The signature
   */
  const verifyUsernameChange = async (newUsername: string): Promise<Uint8Array> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    const options = WalletVerificationService.createUsernameChangeMessage(
      newUsername,
      publicKey.toBase58()
    );

    return verifyOwnership(options);
  };

  /**
   * Verify ownership for team operations
   * @param operation - The team operation
   * @param teamName - The team name
   * @returns Promise<Uint8Array> - The signature
   */
  const verifyTeamOperation = async (operation: string, teamName: string): Promise<Uint8Array> => {
    const options = WalletVerificationService.createTeamOperationMessage(operation, teamName);
    return verifyOwnership(options);
  };

  return {
    verifyOwnership,
    verifyUsernameChange,
    verifyTeamOperation,
    isWalletReady: !!(publicKey && connected && signMessage),
  };
}
