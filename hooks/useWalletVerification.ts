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

  return {
    verifyOwnership,
    isWalletReady: !!(publicKey && connected && signMessage),
    walletAddress: publicKey?.toBase58() || null,
  };
}
