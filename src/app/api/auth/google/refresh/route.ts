import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token mancante' }, { status: 400 });
    }

    // Rinnova il token di accesso
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Errore refresh token:', errorData);
      return NextResponse.json({ error: 'Errore nel rinnovo del token' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();

    return NextResponse.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
    });

  } catch (error) {
    console.error('Errore refresh Google token:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}