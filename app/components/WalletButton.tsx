"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/app/providers/AuthProvider";

export default function WalletButton() {
  const { connected } = useWallet();
  const { user, loading, error } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      <WalletMultiButton />
      
      {connected && loading && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-600">Authenticating…</span>
        </div>
      )}
      
      {connected && error && (
        <div className="text-red-600 text-sm max-w-md text-center">
          Error: {error}
        </div>
      )}
      
      {connected && user && (
        <div className="text-green-600 text-sm text-center">
          ✓ Signed in as {user.username || 'Anonymous User'}
        </div>
      )}
    </div>
  );
}
