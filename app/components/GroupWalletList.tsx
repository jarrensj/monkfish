"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/app/providers/AuthProvider";

interface Team {
  id: string;
  team_name: string;
  wallet_address: string | null;
  owner: string;
  created_at: string;
  role: string;
}

export default function GroupWalletList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        
        // Fetch team memberships for the user
        const { data: teamMembers, error: memberError } = await supabase
          .from("team_members")
          .select("team_id, role")
          .eq("user_id", user.id);

        if (memberError) {
          console.error("Error fetching team members:", memberError);
          setError("Failed to load teams");
          return;
        }


        if (!teamMembers || teamMembers.length === 0) {
          // Also check if there are any teams where user is the owner
          const { data: ownedTeams, error: ownedError } = await supabase
            .from("teams_public")
            .select("*")
            .eq("owner", user.id);
          
          setTeams([]);
          setLoading(false);
          return;
        }

        // Get team IDs
        const teamIds = teamMembers.map(tm => tm.team_id);
        
        // Fetch team details from teams_public view
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams_public")
          .select("id, team_name, wallet_address, owner, created_at")
          .in("id", teamIds);

        
        if (teamsError) {
          console.error("Error fetching teams:", teamsError);
          setError("Failed to load teams");
          return;
        }

        // Merge team data with roles
        const teamsWithRoles = teamsData
          .map((team: any) => {
            const membership = teamMembers.find(tm => tm.team_id === team.id);
            return {
              id: team.id,
              team_name: team.team_name,
              wallet_address: team.wallet_address,
              owner: team.owner,
              created_at: team.created_at,
              role: membership?.role || 'member',
            };
          })
          .filter((team: Team) => team.wallet_address); // Only show teams with wallets

        setTeams(teamsWithRoles);
      } catch (err) {
        console.error("Error:", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [user, refreshTrigger]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      // Clear the notification after 2 seconds
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-600">Loading teams…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Group Wallets</h3>
        <p className="text-gray-600 text-center py-4">
          You haven&apos;t joined or created any teams yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Group Wallets</h3>
        <button
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          title="Refresh teams"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {/* Copy success notification */}
      {copiedAddress && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium animate-fade-in">
          Copied!
        </div>
      )}
      
      <div className="space-y-4">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-gray-50 p-4 rounded-md border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900 text-base">
                  {team.team_name}
                </h4>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {team.role === 'owner' ? 'Owner' : 'Member'}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-gray-700 block mb-1">
                Wallet Address:
              </span>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm text-gray-900 break-all flex-1">
                  {team.wallet_address}
                </p>
                <button
                  onClick={() => copyToClipboard(team.wallet_address || '')}
                  className={`flex-shrink-0 p-2 rounded-md transition-colors ${
                    copiedAddress === team.wallet_address
                      ? 'text-green-600 bg-green-50'
                      : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                  }`}
                  title="Copy to clipboard"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

