import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../lib/server/adminApi';

function prettyCode(code: string | null | undefined): string {
  const clean = String(code || '').replace(/[^0-9A-Z]/gi, '').toUpperCase();
  if (!clean) return '';
  return clean.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1), 500);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);

    const supabase = getServiceClient();
    const { data, error, count } = await supabase
      .from('access_codes')
      .select(
        'id, code, tier, expires_at, max_uses, uses_count, note, created_at, access_code_redemptions(user_email, redeemed_at)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data || []).map((r: any) => ({
      ...r,
      code_pretty: prettyCode(r.code),
    }));

    return NextResponse.json({ rows, count: count || 0, limit, offset }, { status: 200 });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

