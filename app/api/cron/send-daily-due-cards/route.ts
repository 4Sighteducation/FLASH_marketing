import { NextRequest, NextResponse } from 'next/server';

function getBearer(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function GET(request: NextRequest) {
  // Secure this endpoint: only Vercel Cron (or you) should be able to hit it.
  const cronSecret = (process.env.CRON_SECRET || '').trim();
  if (cronSecret) {
    const got = (getBearer(request) || '').trim();
    if (got !== cronSecret) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  } else {
    // If no CRON_SECRET is set, fail closed so we don't accidentally expose this publicly.
    return NextResponse.json({ ok: false, error: 'Missing CRON_SECRET on server' }, { status: 500 });
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://qkapwhyxcpgzahuemucg.supabase.co';

  const jobSecret = (process.env.DAILY_DUE_CARDS_JOB_SECRET || '').trim();
  if (!jobSecret) return NextResponse.json({ ok: false, error: 'Missing DAILY_DUE_CARDS_JOB_SECRET on server' }, { status: 500 });

  const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-daily-due-cards`;
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-daily-due-cards-secret': jobSecret,
    },
    // No debug by default (debug requires ALLOW_DUE_CARDS_DEBUG=true in Supabase function env)
    body: JSON.stringify({}),
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
    return NextResponse.json({ ok: false, error: json?.error || text || `Failed (${res.status})` }, { status: 500 });
  }

  return NextResponse.json(json || { ok: true, raw: text }, { status: 200 });
}

