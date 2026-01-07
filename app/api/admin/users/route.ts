import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../lib/server/adminApi';

type SubscriptionRow = { user_id: string; tier: string | null; expires_at: string | null };
type BetaRow = { user_id: string; tier: string | null; expires_at: string | null };
type ProfileRow = { id: string; username: string | null; primary_exam_type: string | null; secondary_exam_type: string | null };
type LastSeenRow = {
  user_id: string;
  last_seen_at: string;
  platform: string | null;
  app_version: string | null;
  build_version: string | null;
  device_model: string | null;
  os_name: string | null;
  os_version: string | null;
  locale: string | null;
  timezone: string | null;
  country: string | null;
};

function norm(s: any): string {
  return String(s || '').trim().toLowerCase();
}

function countByUserId(rows: Array<any>, key: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows || []) {
    const id = String(r?.[key] || '');
    if (!id) continue;
    m.set(id, (m.get(id) || 0) + 1);
  }
  return m;
}

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const url = new URL(request.url);
    const q = norm(url.searchParams.get('q') || '');
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);

    const supabase = getServiceClient();

    // Supabase Admin API doesn't support server-side search.
    // We'll page through auth users and filter on the server. For "name" search, we also
    // pre-query public.users (username/email) and match by id.
    const perPage = 200;
    const maxPages = 50; // safety; your project is currently small
    const matches: any[] = [];

    // Optional: ids matching username/email in public.users
    let profileIdSet: Set<string> | null = null;
    if (q) {
      const { data: profIds } = await supabase
        .from('users')
        .select('id')
        .or(`email.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(2000);
      profileIdSet = new Set((profIds || []).map((r: any) => String(r.id)));
    }

    for (let page = 1; page <= maxPages && matches.length < offset + limit; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const users = data?.users || [];
      if (users.length === 0) break;

      const filtered = q
        ? users.filter((u: any) => {
            const email = norm(u.email);
            const meta = (u.user_metadata || {}) as any;
            const uname = norm(meta?.username || meta?.name || meta?.full_name || '');
            if (email.includes(q)) return true;
            if (uname.includes(q)) return true;
            if (profileIdSet && profileIdSet.has(String(u.id))) return true;
            return false;
          })
        : users;

      matches.push(...filtered);
      if (users.length < perPage) break;
    }

    const sliced = matches.slice(offset, offset + limit);
    const ids = sliced.map((u: any) => u.id);

    let subsByUserId = new Map<string, SubscriptionRow>();
    let betaByUserId = new Map<string, BetaRow>();
    let profilesByUserId = new Map<string, ProfileRow>();
    let lastSeenByUserId = new Map<string, LastSeenRow>();
    let subjectsCountByUserId = new Map<string, number>();
    let cardsCountByUserId = new Map<string, number>();
    let redemptionsCountByUserId = new Map<string, number>();
    let parentPurchasesByUserId = new Map<string, number>();
    if (ids.length > 0) {
      const { data: subs, error: subsErr } = await supabase
        .from('user_subscriptions')
        .select('user_id,tier,expires_at')
        .in('user_id', ids);
      if (!subsErr && subs) subsByUserId = new Map(subs.map((r: any) => [r.user_id, r]));

      const { data: betas } = await supabase
        .from('beta_access')
        .select('user_id,tier,expires_at')
        .in('user_id', ids);
      if (betas) betaByUserId = new Map(betas.map((r: any) => [r.user_id, r]));

      const { data: profiles } = await supabase
        .from('users')
        .select('id,username,primary_exam_type,secondary_exam_type')
        .in('id', ids);
      if (profiles) profilesByUserId = new Map(profiles.map((r: any) => [r.id, r]));

      const { data: seen } = await supabase
        .from('user_last_seen')
        .select('user_id,last_seen_at,platform,app_version,build_version,device_model,os_name,os_version,locale,timezone,country')
        .in('user_id', ids);
      if (seen) lastSeenByUserId = new Map(seen.map((r: any) => [r.user_id, r]));

      // Activation: subject/card counts (compute in JS to avoid PostgREST aggregate quirks)
      const { data: subjRows } = await supabase.from('user_subjects').select('user_id').in('user_id', ids);
      if (subjRows) subjectsCountByUserId = countByUserId(subjRows as any[], 'user_id');

      const { data: cardRows } = await supabase.from('flashcards').select('user_id').in('user_id', ids);
      if (cardRows) cardsCountByUserId = countByUserId(cardRows as any[], 'user_id');

      // Monetization: redemptions + parent purchases
      const { data: redRows } = await supabase.from('access_code_redemptions').select('user_id').in('user_id', ids);
      if (redRows) redemptionsCountByUserId = countByUserId(redRows as any[], 'user_id');

      const { data: parentRows } = await supabase.from('parent_claims').select('claimed_by').in('claimed_by', ids);
      if (parentRows) parentPurchasesByUserId = countByUserId(parentRows as any[], 'claimed_by');
    }

    const rows = sliced.map((u: any) => {
      const sub = subsByUserId.get(u.id);
      const beta = betaByUserId.get(u.id);
      const profile = profilesByUserId.get(u.id);
      const seen = lastSeenByUserId.get(u.id);
      const meta = (u.user_metadata || {}) as any;
      const displayName = profile?.username || meta?.username || meta?.name || meta?.full_name || null;

      // Resolve tier with beta override
      const resolvedTier = (beta?.tier || sub?.tier || null) as string | null;
      const resolvedExpiresAt = beta?.expires_at || sub?.expires_at || null;

      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        banned_until: u.banned_until,
        name: displayName,
        tracks: { primary: profile?.primary_exam_type ?? null, secondary: profile?.secondary_exam_type ?? null },
        subscription: { tier: resolvedTier, expires_at: resolvedExpiresAt, source: beta ? 'beta_access' : sub ? 'user_subscriptions' : null },
        device: seen
          ? {
              last_seen_at: seen.last_seen_at,
              platform: seen.platform,
              app_version: seen.app_version,
              build_version: seen.build_version,
              device_model: seen.device_model,
              os_name: seen.os_name,
              os_version: seen.os_version,
              country: seen.country,
            }
          : null,
        activation: {
          subjects_count: subjectsCountByUserId.get(u.id) ?? 0,
          cards_count: cardsCountByUserId.get(u.id) ?? 0,
        },
        monetization: {
          redemptions_count: redemptionsCountByUserId.get(u.id) ?? 0,
          parent_purchases_count: parentPurchasesByUserId.get(u.id) ?? 0,
        },
      };
    });

    return NextResponse.json({ rows, limit, offset, hasMore: matches.length > offset + limit });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}



