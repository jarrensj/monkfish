import { PublicKey } from '@solana/web3.js';

export interface WalletSigner {
  publicKey: PublicKey;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

export interface VerificationOptions {
  action: string;
  details?: string;
  timestamp?: number;
}

export class WalletVerificationService {
  /**
   * Verify wallet ownership by requiring a signature
   * @param signer - Wallet signer with publicKey and signMessage function
   * @param options - Verification options including action description
   * @returns Promise<Uint8Array> - The signature bytes
   * @throws Error if verification fails
   */
  static async verifyOwnership(
    signer: WalletSigner,
    options: VerificationOptions
  ): Promise<Uint8Array> {
    const { publicKey, signMessage } = signer;
    const { action, details, timestamp = Date.now() } = options;

    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected or does not support signing');
    }

    // Create message to sign for verification
    let message = `Verify wallet ownership for: ${action}`;
    
    if (details) {
      message += `\n\nDetails: ${details}`;
    }
    
    message += `\n\nWallet: ${publicKey.toBase58()}\nTimestamp: ${timestamp}`;
    
    const messageBytes = new TextEncoder().encode(message);

    // Request wallet signature
    let signature: Uint8Array;
    try {
      signature = await signMessage(messageBytes);
    } catch (signError) {
      throw new Error('Signature verification cancelled or failed');
    }

    // Verify the signature (basic verification that we got a signature)
    if (!signature || signature.length === 0) {
      throw new Error('Invalid signature received');
    }

    return signature;
  }

  /**
   * Create a verification message for username changes
   * @param newUsername - The new username being set
   * @param walletAddress - The wallet address
   * @returns Formatted message for signing
   */
  static createUsernameChangeMessage(newUsername: string, walletAddress: string): VerificationOptions {
    return {
      action: 'Change Username',
      details: `New username: "${newUsername}"`,
    };
  }

  /**
   * Create a verification message for team operations
   * @param operation - The team operation (create, join, leave, etc.)
   * @param teamName - The team name
   * @returns Formatted message for signing
   */
  static createTeamOperationMessage(operation: string, teamName: string): VerificationOptions {
    return {
      action: `Team ${operation}`,
      details: `Team: "${teamName}"`,
    };
  }
}
