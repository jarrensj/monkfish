import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.WALLET_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, owner } = body;

    if (!teamName || !owner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team name and owner are required',
        },
        { status: 400 }
      );
    }

    // Call the backend wallet generation service
    const response = await fetch(`${BACKEND_URL}/api/wallet/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamName, owner }),
    });

    if (!response.ok) {
      throw new Error('Backend wallet generation failed');
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      publicAddress: data.publicAddress,
      id: data.id,
      teamName: data.teamName,
    });
  } catch (error) {
    console.error('Error generating wallet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate wallet',
      },
      { status: 500 }
    );
  }
}

