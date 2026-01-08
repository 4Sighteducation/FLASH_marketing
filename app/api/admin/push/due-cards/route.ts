import { NextRequest, NextResponse } from 'next/server';
import { parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://qkapwhyxcpgzahuemucg.supabase.co';

    const jobSecret = (process.env.DAILY_DUE_CARDS_JOB_SECRET || '').trim();
    if (!jobSecret) return NextResponse.json({ error: 'Missing DAILY_DUE_CARDS_JOB_SECRET on server' }, { status: 500 });

    const body = await request.json().catch(() => ({}));
    const user_email = typeof body?.user_email === 'string' ? body.user_email.trim() : null;

    const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-daily-due-cards`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-daily-due-cards-secret': jobSecret,
      },
      body: JSON.stringify(user_email ? { user_email } : {}),
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
      return NextResponse.json({ error: json?.error || text || `Failed (${res.status})` }, { status: 500 });
    }

    return NextResponse.json(json || { ok: true, raw: text }, { status: 200 });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

