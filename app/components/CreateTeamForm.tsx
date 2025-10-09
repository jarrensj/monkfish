"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/app/providers/AuthProvider";

interface CreateTeamFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateTeamForm({ onSuccess, onCancel }: CreateTeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdTeamName, setCreatedTeamName] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to create a team");
      return;
    }

    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      
      // Create the team
      const { data, error: insertError } = await supabase
        .from("teams")
        .insert({
          team_name: teamName.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          setError("Team name already exists. Please choose a different name.");
        } else {
          setError(insertError.message);
        }
        return;
      }

      // Success!
      setCreatedTeamName(teamName.trim());
      setTeamName("");
      setSuccess(true);
      
      // Delay calling onSuccess to show the success message
      setTimeout(() => {
        onSuccess?.();
      }, 7000);
      
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Team creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Show success state
  if (success) {
    return (
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-2xl mx-auto">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">Team Created Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your team <span className="font-semibold text-gray-900">"{createdTeamName}"</span> has been created and you've been added as the owner.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700">
              🎉 You can now start inviting members and managing your team!
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Redirecting you back to the main page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-2">Create New Team</h3>
        <p className="text-gray-600">Set up your team and start collaborating</p>
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
            placeholder="Enter your team name"
            disabled={loading}
            maxLength={100}
          />
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
                Creating Team...
              </div>
            ) : (
              "Create Team"
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