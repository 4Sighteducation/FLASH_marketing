import { NextResponse } from 'next/server';
import { isAllowedOrigin, validateHoneypotAndTiming, verifyTurnstileToken } from '../../../lib/server/turnstile';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const turnstileToken = body?.turnstileToken;
    const website = body?.website;
    const formStartedAt = body?.formStartedAt;

    if (!isAllowedOrigin(req)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const timingError = validateHoneypotAndTiming({ website, formStartedAt: Number(formStartedAt) });
    if (timingError) {
      return NextResponse.json({ ok: false, error: timingError }, { status: 403 });
    }

    if (!turnstileToken) {
      return NextResponse.json({ ok: false, error: 'Verification failed' }, { status: 403 });
    }

    const verify = await verifyTurnstileToken({
      token: String(turnstileToken),
      ip: req.headers.get('x-forwarded-for'),
    });

    if (!verify?.success) {
      return NextResponse.json({ ok: false, error: 'Verification failed' }, { status: 403 });
    }
    const childEmail = String(body?.childEmail || '').trim();
    if (!childEmail) {
      return NextResponse.json({ ok: false, error: 'Missing childEmail' }, { status: 400 });
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    if (!supabaseUrl) {
      return NextResponse.json({ ok: false, error: 'Supabase URL not configured' }, { status: 500 });
    }

    const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/parent-checkout`;

    // Supabase Edge Functions typically require an apikey header even when verify_jwt is disabled.
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey
          ? {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            }
          : {}),
      },
      body: JSON.stringify({ childEmail }),
      cache: 'no-store',
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // ignore
    }

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: json?.error || json?.message || text || `Checkout failed (${res.status})` },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, url: json?.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
