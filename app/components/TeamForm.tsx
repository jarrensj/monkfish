"use client";

import { useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/app/providers/AuthProvider";
import { TEAM_FORM_CONFIG } from "@/config/teamFormConfig";

interface TeamFormProps {
  mode: 'create' | 'join';
  onSuccess?: (teamName: string) => void;
  onCancel?: () => void;
}

export default function TeamForm({ mode, onSuccess, onCancel }: TeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  
  const config = useMemo(() => TEAM_FORM_CONFIG[mode], [mode]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      
      if (mode === 'create') {
        // Generate a wallet and create team in one backend call
        const walletResponse = await fetch('/api/wallet/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamName: teamName.trim(),
            userId: user.id,
          }),
        });
        
        const walletData = await walletResponse.json();
        
        if (!walletResponse.ok) {
          console.error('Wallet generation failed:', walletData);
          throw new Error(walletData.error || 'Failed to generate team wallet');
        }
        
        console.log(`✅ Team created with wallet: ${walletData.publicAddress}`);
      } else {
        // Single query with error handling - use teams_public view
        const { data: team, error: teamError } = await supabase
          .from("teams_public")
          .select("id")
          .ilike("team_name", teamName.trim())
          .single();
          
        if (teamError || !team) {
          setError("Team not found");
          return;
        }
        
        const { error } = await supabase.from("team_members").insert({
          team_id: team.id,
          user_id: user.id,
          role: 'member'
        });
        if (error) throw error;
      }

      // Immediate redirect - no delay
      onSuccess?.(teamName.trim());
      
    } catch (err: unknown) {
      console.error('Team form error:', err);
      // Simple but helpful error messages
      const error = err as { code?: string; message?: string };
      if (error.code === '23505') {
        setError(mode === 'create' ? "Team name already exists" : "Already a member");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-2">{config.title}</h3>
        <p className="text-gray-600">{config.subtitle}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="teamName" className="block text-base font-semibold text-gray-700 mb-3">
            Team Name *
          </label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder={config.placeholder}
            disabled={loading}
            maxLength={100}
          />
          {mode === 'join' && (
            <p className="text-sm text-gray-500 mt-2">
              Enter the name of the team you&apos;d like to join
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={loading || !teamName.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {config.loadingText}
              </div>
            ) : (
              config.buttonText
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg text-lg font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 border border-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
