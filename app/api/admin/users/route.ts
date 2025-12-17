import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../lib/server/adminApi';

type SubscriptionRow = {
  user_id: string;
  tier: string | null;
  expires_at: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 1), 100);

    const supabase = getServiceClient();

    // Supabase Admin API doesn't support server-side "search by email" directly.
    // We'll page through a bounded amount of users and filter on the server.
    const perPage = 200;
    const maxPages = 10;
    const matches: any[] = [];

    for (let page = 1; page <= maxPages && matches.length < limit; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const users = data?.users || [];
      if (users.length === 0) break;

      const filtered = q
        ? users.filter((u: any) => (u.email || '').toLowerCase().includes(q))
        : users;

      matches.push(...filtered);
      if (users.length < perPage) break;
    }

    const sliced = matches.slice(0, limit);
    const ids = sliced.map((u: any) => u.id);

    let subsByUserId = new Map<string, SubscriptionRow>();
    if (ids.length > 0) {
      const { data: subs, error: subsErr } = await supabase
        .from('user_subscriptions')
        .select('user_id,tier,expires_at')
        .in('user_id', ids);
      if (!subsErr && subs) subsByUserId = new Map(subs.map((r: any) => [r.user_id, r]));
    }

    const rows = sliced.map((u: any) => {
      const sub = subsByUserId.get(u.id);
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        banned_until: u.banned_until,
        subscription: sub
          ? { tier: sub.tier, expires_at: sub.expires_at }
          : { tier: null, expires_at: null },
      };
    });

    return NextResponse.json({ rows });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}



