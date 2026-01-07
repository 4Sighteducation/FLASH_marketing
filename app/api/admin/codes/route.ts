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

    // New columns (assignment + cancellation). If the DB migration hasn't been applied yet,
    // fall back to the old select so the page doesn't 500 on deploy.
    const selectV2 =
      'id, code, tier, expires_at, max_uses, uses_count, note, created_at, assigned_to, assigned_note, assigned_at, cancelled_at, cancelled_note, access_code_redemptions(user_email, redeemed_at)';
    const selectV1 = 'id, code, tier, expires_at, max_uses, uses_count, note, created_at, access_code_redemptions(user_email, redeemed_at)';

    let data: any[] | null = null;
    let count: number | null = null;
    {
      const q = supabase
        .from('access_codes')
        .select(selectV2, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const res = await q;
      if (!res.error) {
        data = res.data as any[];
        count = res.count ?? 0;
      } else if (String(res.error.message || '').includes('does not exist')) {
        const res2 = await supabase
          .from('access_codes')
          .select(selectV1, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (res2.error) return NextResponse.json({ error: res2.error.message }, { status: 500 });
        data = res2.data as any[];
        count = res2.count ?? 0;
      } else {
        return NextResponse.json({ error: res.error.message }, { status: 500 });
      }
    }

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

