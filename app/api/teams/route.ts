import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { generateUniqueSlug } from '@/lib/slugUtils'

/**
 * POST /api/teams
 * Creates a new team with the provided team name and owner.
 * Validates input, generates a unique slug, and stores the team in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { team_name, owner, wallet_addresses = [] } = body

    // Validate required fields
    if (!team_name || !owner) {
      return NextResponse.json(
        { error: 'Team name and owner are required' },
        { status: 400 }
      )
    }

    // Trim team name once for all subsequent operations
    const trimmedTeamName = team_name.trim()

    // Validate team name length
    if (trimmedTeamName.length === 0) {
      return NextResponse.json(
        { error: 'Team name cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedTeamName.length > 50) {
      return NextResponse.json(
        { error: 'Team name must be 50 characters or less' },
        { status: 400 }
      )
    }

    // Validate team name contains only letters, numbers, and spaces
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmedTeamName)) {
      return NextResponse.json(
        { error: 'Team name can only contain letters, numbers, and spaces' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseBrowserClient()

    // Generate unique slug from team name
    const slug = await generateUniqueSlug(trimmedTeamName)

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        team_name: trimmedTeamName,
        slug,
        owner,
        wallet_addresses
      })
      .select()
      .single()

    if (teamError) {
      console.error('Error creating team:', teamError)
      
      // Handle specific database errors
      if (teamError.code === '23505') {
        if (teamError.message.includes('team_name')) {
          return NextResponse.json(
            { error: 'A team with this name already exists' },
            { status: 409 }
          )
        }
        if (teamError.message.includes('slug')) {
          return NextResponse.json(
            { error: 'Unable to generate unique slug. Please try a different team name.' },
            { status: 409 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      )
    }

    return NextResponse.json(team, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/teams
 * Retrieves a paginated list of teams with their members.
 * Supports limit and offset query parameters for pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createSupabaseBrowserClient()

    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        slug,
        wallet_addresses,
        created_at,
        owner,
        team_members!inner(
          user:users(username, wallet_address)
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      )
    }

    return NextResponse.json(teams)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
