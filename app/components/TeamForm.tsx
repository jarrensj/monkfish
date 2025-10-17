"use client";

import { useState, useMemo, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/app/providers/AuthProvider";
import { TEAM_FORM_CONFIG } from "@/config/teamFormConfig";
import { generateSlug } from "@/lib/slugUtils";

interface TeamFormProps {
  mode: 'create' | 'join';
  onSuccess?: (teamName: string) => void;
  onCancel?: () => void;
}

export default function TeamForm({ mode, onSuccess, onCancel }: TeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_BASE_URL || '');
  const { user } = useAuth();

  // Set base URL from browser location when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);
  
  const config = useMemo(() => TEAM_FORM_CONFIG[mode], [mode]);
  
  // Trim team name once and memoize for all validations
  const trimmedTeamName = useMemo(() => teamName.trim(), [teamName]);

  // Generate slug preview for create mode
  const slugPreview = useMemo(() => {
    if (mode !== 'create' || !trimmedTeamName) return '';
    // Remove invalid characters before generating slug for preview
    const sanitized = trimmedTeamName.replace(/[^a-zA-Z0-9\s]/g, '');
    return generateSlug(sanitized);
  }, [mode, trimmedTeamName]);

  // Check for invalid characters in team name
  const hasInvalidChars = useMemo(() => {
    if (mode !== 'create' || !trimmedTeamName) return false;
    return !/^[a-zA-Z0-9\s]+$/.test(trimmedTeamName);
  }, [mode, trimmedTeamName]);

  // Check if form is valid for create mode
  const isFormValid = useMemo(() => {
    if (!trimmedTeamName) return false;
    // Check if only contains valid characters
    return /^[a-zA-Z0-9\s]+$/.test(trimmedTeamName);
  }, [trimmedTeamName]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !trimmedTeamName) {
      setError("Please enter a team name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (mode === 'create') {
        // Use API route for team creation
        const response = await fetch('/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            team_name: trimmedTeamName,
            owner: user.id,
            wallet_addresses: []
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to create team');
          return;
        }

        // Success - redirect with the created team's slug
        onSuccess?.(data.slug);
        
      } else {
        // Join team logic remains the same (direct database access)
        const supabase = createSupabaseBrowserClient();
        
        // Single query with error handling
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("id")
          .ilike("team_name", trimmedTeamName)
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
        
        if (error) {
          if (error.code === '23505') {
            setError("Already a member of this team");
          } else {
            setError("Failed to join team. Please try again.");
          }
          return;
        }

        // Success - redirect with team name (for join mode)
        onSuccess?.(trimmedTeamName);
      }
      
    } catch (err: unknown) {
      console.error('Team operation error:', err);
      setError("Something went wrong. Please try again.");
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
            className="w-full px-4 py-3 text-lg text-gray-900 bg-white border-2 border-gray-300 rounded-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
            placeholder={config.placeholder}
            disabled={loading}
            maxLength={50}
          />
          
          {/* Slug Preview for Create Mode */}
          {mode === 'create' && slugPreview && (
            <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-sm text-blue-700 font-semibold">Your team will be available at:</p>
              </div>
              <div className="bg-white border border-blue-200 rounded-md p-3 font-mono text-sm shadow-inner">
                <div className="flex items-center">
                  <span className="text-gray-500">
                    {baseUrl || 'your-domain.com'}/team/
                  </span>
                  <span className="font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-md ml-1 border border-blue-300">
                    {slugPreview}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Invalid characters warning */}
          {mode === 'create' && hasInvalidChars && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Team name can only contain letters, numbers, and spaces
            </div>
          )}
          
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

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading || !trimmedTeamName || (mode === 'create' && !isFormValid)}
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
