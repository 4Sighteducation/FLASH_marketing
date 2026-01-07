import { NextRequest, NextResponse } from 'next/server';
import { parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

function sanitizeTier(t: any): 'pro' | 'premium' {
  return t === 'premium' ? 'premium' : 'pro';
}

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const body = await request.json().catch(() => ({}));
    const count = Math.min(500, Math.max(1, Number(body?.count) || 0));
    if (!count) return NextResponse.json({ error: 'Invalid count' }, { status: 400 });

    const tier = sanitizeTier(body?.tier);
    const maxUses = Math.min(50, Math.max(1, Number(body?.maxUses) || 1));
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 140) : null;
    const expiresAtIso = typeof body?.expiresAtIso === 'string' ? body.expiresAtIso : null;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://qkapwhyxcpgzahuemucg.supabase.co';

    const adminSecret = (process.env.BETA_ACCESS_ADMIN_SECRET || '').trim();
    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Missing BETA_ACCESS_ADMIN_SECRET on server (Vercel env var).' },
        { status: 500 }
      );
    }

    const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/access-code-admin`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret,
      },
      body: JSON.stringify({
        action: 'bulk_create',
        count,
        tier,
        maxUses,
        note,
        expiresAtIso,
      }),
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

    return NextResponse.json(json, { status: 200 });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

