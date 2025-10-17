'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient, Team, TeamMember, User } from '@/lib/supabase'

interface TeamWithMembers extends Team {
  members: (TeamMember & { user: User })[]
}

export default function TeamPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [team, setTeam] = useState<TeamWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTeamData() {
      if (!slug) return

      try {
        const supabase = createSupabaseBrowserClient()

        // Fetch team by slug
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('slug', slug)
          .single()

        if (teamError) {
          if (teamError.code === 'PGRST116') {
            setError('Team not found')
          } else {
            setError('Failed to load team')
          }
          return
        }

        // Fetch team members with user details
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            *,
            user:users(*)
          `)
          .eq('team_id', teamData.id)
          .order('role', { ascending: false }) // Show owners first
          .order('joined_at', { ascending: true })

        if (membersError) {
          console.error('Error fetching members:', membersError)
          setError('Failed to load team members')
          return
        }

        setTeam({
          ...teamData,
          members: membersData || []
        })
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team…</p>
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              {error || 'Team not found'}
            </h1>
            <p className="text-red-600 mb-4">
              The team you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back to Home Button */}
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 shadow-sm"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </button>

        {/* Team Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.team_name}</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium text-gray-900">
                {new Date(team.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Wallet Addresses */}
          {team.wallet_addresses && team.wallet_addresses.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Team Wallets</h3>
              <div className="flex flex-wrap gap-2">
                {team.wallet_addresses.map((wallet, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <span className="uppercase mr-1">{wallet.chain}</span>
                    <span className="font-mono">
                      {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Team Members ({team.members.length})
            </h2>
          </div>

          {team.members.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No members found in this team.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {team.members.map((member) => (
                <div key={member.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {member.user.username 
                            ? member.user.username.charAt(0).toUpperCase()
                            : member.user.wallet_address.slice(0, 2).toUpperCase()
                          }
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {member.user.username || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono">
                        {member.user.wallet_address.slice(0, 8)}…{member.user.wallet_address.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'owner'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {member.role === 'owner' ? '👑 Owner' : 'Member'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}