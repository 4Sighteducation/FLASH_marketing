import { NextRequest, NextResponse } from 'next/server';
import { parseBearerToken, requireAdminFromBearerToken } from '../../../../lib/server/adminApi';

const ADMIN_COOKIE_NAME = 'flash_admin_token';

function cookieOptions(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  // If you're behind a proxy (Vercel), this is still fine; Secure will work in prod.
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function POST(req: NextRequest) {
  try {
    const token = parseBearerToken(req.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });

    const user = await requireAdminFromBearerToken(token);

    const res = NextResponse.json({ ok: true, email: user.email, id: user.id });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      ...cookieOptions(req),
      // Keep short; this is just a gate to protect the admin UI.
      maxAge: 60 * 60 * 12, // 12h
    });
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, '', { ...cookieOptions(req), maxAge: 0 });
  return res;
}

