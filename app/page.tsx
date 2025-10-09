"use client";

import WalletButton from "./components/WalletButton";
import UsernameForm from "./components/UsernameForm";
import UserProfile from "./components/UserProfile";
import CreateTeamForm from "./components/CreateTeamForm";
import { useAuth } from "./providers/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";

export default function Home() {
  const { connected } = useWallet();
  const { user, loading } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Show loading state
  if (connected && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading…</p>
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

  // Show create team form
  if (showCreateTeam) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with back button */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => setShowCreateTeam(false)}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Home
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">Create Team</h1>
            </div>
          </div>
        </header>
        
        {/* Create team content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
          <div className="w-full max-w-2xl">
          <CreateTeamForm 
            onSuccess={() => {
              setShowCreateTeam(false);
              setShowSuccessMessage(true);
              // Hide success message after 5 seconds
              setTimeout(() => setShowSuccessMessage(false), 5000);
            }}
            onCancel={() => setShowCreateTeam(false)}
          />
          </div>
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

      {/* Success Message Banner */}
      {showSuccessMessage && (
        <div className="flex justify-center mt-4 px-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow-sm max-w-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Team created successfully! You can now start managing your team.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              You&apos;re all set!
            </h2>
            <p className="text-gray-600 mb-8">
              Your wallet is connected and you&apos;re authenticated.
            </p>
            
            {/* Quick Actions */}
            <div className="mb-8">
              <button
                onClick={() => setShowCreateTeam(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium shadow-md"
              >
                + Create a Team
              </button>
            </div>
            
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
