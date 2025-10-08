"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {
  return (
    <div className="flex items-center justify-center p-4">
      <WalletMultiButton />
    </div>
  );
}
