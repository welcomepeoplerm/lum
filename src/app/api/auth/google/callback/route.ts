import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Codice di autorizzazione mancante' }, { status: 400 });
    }

    // Scambia il codice di autorizzazione per i token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Errore token response:', errorData);
      return NextResponse.json({ error: 'Errore nello scambio del codice' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();

    // Ottieni le informazioni dell'utente
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Errore nel recupero informazioni utente' }, { status: 400 });
    }

    const user = await userResponse.json();

    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('Errore callback Google:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}