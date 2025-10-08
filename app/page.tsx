"use client";

import WalletButton from "./components/WalletButton";
import UsernameForm from "./components/UsernameForm";
import UserProfile from "./components/UserProfile";
import { useAuth } from "./providers/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";

export default function Home() {
  const { connected } = useWallet();
  const { user, loading } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  // Show loading state
  if (connected && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection if not connected
  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center mb-8">
          <p className="text-gray-600 text-lg">Connect your wallet to get started</p>
        </div>
        <WalletButton />
      </div>
    );
  }

  // Show username form for first-time users without username
  if (user && !user.username && !showProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <UsernameForm 
          isFirstTime={true} 
          onComplete={() => setShowProfile(true)} 
        />
      </div>
    );
  }

  // Show profile or main app interface
  if (showProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with back button */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => setShowProfile(false)}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Home
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">Profile</h1>
            </div>
          </div>
        </header>
        
        {/* Profile content */}
        <div className="flex items-center justify-center py-8 px-4">
          <UserProfile />
        </div>
      </div>
    );
  }

  // Main app interface for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.username}
              </span>
              <div className="flex items-center space-x-2">
                <WalletMultiButton className="!text-xs !py-1 !px-3" />
                <button
                  onClick={() => setShowProfile(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              You're all set!
            </h2>
            <p className="text-gray-600 mb-8">
              Your wallet is connected and you&apos;re authenticated.
            </p>
            
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Account Info</h3>
              <div className="space-y-4 text-left">
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-sm font-medium text-gray-700">Wallet Address:</span>
                  <p className="font-mono text-sm text-gray-900 break-all mt-1">
                    {user?.wallet_address || 'Not available'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-sm font-medium text-gray-700">Username:</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {user?.username || <em className="text-gray-500">Not set</em>}
                  </p>
                </div>
              </div>
              
              {/* Add quick username setting button if no username */}
              {user && !user.username && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => setShowProfile(true)}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Set Username
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
