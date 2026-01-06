import { NextRequest, NextResponse } from 'next/server';
import { parseBearerToken, requireAdminFromBearerToken } from '../../../../lib/server/adminApi';

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    return NextResponse.json({
      ok: true,
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
      deployedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

