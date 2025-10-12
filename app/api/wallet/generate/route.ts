import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.WALLET_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, teamId, userId } = body;

    // Validate required fields
    if (!userId) {
      console.error('Missing userId in request');
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    if (!teamName && !teamId) {
      console.error('Missing teamName/teamId in request');
      return NextResponse.json(
        {
          success: false,
          error: 'Team name or team ID is required',
        },
        { status: 400 }
      );
    }

    // Verify environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: Missing Supabase credentials',
        },
        { status: 500 }
      );
    }

    // Create Supabase server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Check if team already exists (for authorization)
    let teamQuery = supabase.from('teams_public').select('id, owner');
    
    if (teamId) {
      teamQuery = teamQuery.eq('id', teamId);
    } else {
      teamQuery = teamQuery.eq('team_name', teamName);
    }

    const { data: team, error: teamError } = await teamQuery.single();

    // If team exists, verify authorization
    if (team && !teamError) {
      // Check if user is the team owner
      const isOwner = team.owner === userId;

      // Check if user is a team member
      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', userId)
        .single();

      const isMember = !membershipError && membership !== null;

      // Authorize: user must be owner or member
      if (!isOwner && !isMember) {
        console.error('Authorization failed:', { isOwner, isMember });
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: You must be a team owner or member to generate a wallet for this team',
          },
          { status: 403 }
        );
      }

    } 

    // Call the backend wallet generation service
    const response = await fetch(`${BACKEND_URL}/api/wallet/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        teamName, 
        owner: team?.owner || userId, // Use existing team owner or current user for new teams
        userId // Required by backend for authentication
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Backend wallet generation failed:', data);
      throw new Error(data.error || 'Backend wallet generation failed');
    }

    return NextResponse.json({
      success: true,
      publicAddress: data.publicAddress,
      id: data.id,
      teamName: data.teamName,
    });
  } catch (error) {
    console.error('Error generating wallet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate wallet';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

