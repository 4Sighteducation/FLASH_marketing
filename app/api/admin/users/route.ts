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
type DailyStudyRow = { user_id: string; study_date: string; reviews_total: number };
type CardReviewRow = { user_id: string; reviewed_at: string };

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

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, deltaDays: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + deltaDays);
  return x;
}

function ymdFromIso(iso: string): string | null {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
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
    let reviews7dByUserId = new Map<string, number>();
    let streakDaysByUserId = new Map<string, number>();
    let lastStudyDateByUserId = new Map<string, string>();
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

      // Engagement: reviews in last 7 days + streak + last study date (from MV)
      const today = new Date();
      const since = ymd(addDays(today, -6));
      const dailyRes = await supabase
        .from('user_daily_study_stats_mv')
        .select('user_id,study_date,reviews_total')
        .in('user_id', ids)
        .gte('study_date', since)
        .limit(10000);
      let dailyRows = (dailyRes as any)?.data || [];

      // If MV is missing/stale, fall back to live card_reviews.
      // (MVs don't auto-refresh; many dashboards appear empty until refreshed.)
      if (!Array.isArray(dailyRows) || dailyRows.length === 0) {
        const sinceTs = new Date();
        sinceTs.setHours(0, 0, 0, 0);
        sinceTs.setDate(sinceTs.getDate() - 6);
        const { data: reviewRows, error: reviewsErr } = await supabase
          .from('card_reviews')
          .select('user_id,reviewed_at')
          .in('user_id', ids)
          .gte('reviewed_at', sinceTs.toISOString())
          .limit(200000);

        if (!reviewsErr && Array.isArray(reviewRows) && reviewRows.length > 0) {
          const tmp: DailyStudyRow[] = [];
          const counts = new Map<string, Map<string, number>>();
          for (const r of reviewRows as unknown as CardReviewRow[]) {
            const uid = String((r as any).user_id || '');
            const d = ymdFromIso(String((r as any).reviewed_at || ''));
            if (!uid || !d) continue;
            const byDate = counts.get(uid) || new Map<string, number>();
            byDate.set(d, (byDate.get(d) || 0) + 1);
            counts.set(uid, byDate);
          }
          counts.forEach((byDate, uid) => {
            byDate.forEach((n, d) => tmp.push({ user_id: uid, study_date: d, reviews_total: n }));
          });
          dailyRows = tmp;
        }
      }

      // Build per-user date sets + totals (from MV or fallback rows)
      const datesByUser = new Map<string, Set<string>>();
      for (const r of (dailyRows || []) as unknown as DailyStudyRow[]) {
        const uid = String((r as any).user_id || '');
        const sd = String((r as any).study_date || '');
        const reviews = Number((r as any).reviews_total || 0);
        if (!uid || !sd) continue;
        reviews7dByUserId.set(uid, (reviews7dByUserId.get(uid) || 0) + reviews);
        const set = datesByUser.get(uid) || new Set<string>();
        set.add(sd);
        datesByUser.set(uid, set);
        const prev = lastStudyDateByUserId.get(uid);
        if (!prev || sd > prev) lastStudyDateByUserId.set(uid, sd);
      }

      // Streak from today backwards (max 7 days)
      for (const uid of ids) {
        const set = datesByUser.get(uid) || new Set<string>();
        let streak = 0;
        for (let i = 0; i < 7; i++) {
          const date = ymd(addDays(today, -i));
          if (set.has(date)) streak++;
          else break;
        }
        streakDaysByUserId.set(uid, streak);
      }
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
        engagement: {
          reviews_7d: reviews7dByUserId.get(u.id) ?? 0,
          streak_days: streakDaysByUserId.get(u.id) ?? 0,
          last_study_date: lastStudyDateByUserId.get(u.id) ?? null,
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



