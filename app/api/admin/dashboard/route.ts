import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../lib/server/adminApi';

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, deltaDays: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + deltaDays);
  return x;
}

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const supabase = getServiceClient();

    const [{ count: waitlistCount }, { count: usersCount }, { count: redeemsCount }, { count: parentBuysCount }] =
      await Promise.all([
        supabase.from('waitlist').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('access_code_redemptions').select('id', { count: 'exact', head: true }),
        supabase.from('parent_claims').select('id', { count: 'exact', head: true }).not('claimed_by', 'is', null),
      ]);

    // Active in last 7 days (best-effort; project currently small)
    const since = ymd(addDays(new Date(), -6));
    let active7dUserIds = new Set<string>();
    {
      const mvRes = await supabase
        .from('user_daily_study_stats_mv')
        .select('user_id,study_date')
        .gte('study_date', since)
        .limit(100000);
      const activeRows = (mvRes as any)?.data || [];
      active7dUserIds = new Set((activeRows || []).map((r: any) => String(r.user_id || '')).filter(Boolean));

      // Fallback: derive activity directly from card_reviews when MV is empty/missing.
      if (active7dUserIds.size === 0) {
        const sinceTs = new Date();
        sinceTs.setHours(0, 0, 0, 0);
        sinceTs.setDate(sinceTs.getDate() - 6);
        const { data: reviewRows, error: reviewErr } = await supabase
          .from('card_reviews')
          .select('user_id,reviewed_at')
          .gte('reviewed_at', sinceTs.toISOString())
          .limit(200000);
        if (!reviewErr && Array.isArray(reviewRows)) {
          for (const r of reviewRows as any[]) {
            const uid = String((r as any)?.user_id || '');
            if (uid) active7dUserIds.add(uid);
          }
        }
      }
    }

    // Pro/Premium counts (beta_access overrides are the primary mechanism; include user_subscriptions if present)
    const { data: betas } = await supabase.from('beta_access').select('user_id,tier').limit(100000);
    const betaTierByUserId = new Map<string, string>();
    for (const r of betas || []) betaTierByUserId.set(String((r as any).user_id), String((r as any).tier || ''));

    const { data: subs } = await supabase
      .from('user_subscriptions')
      .select('user_id,tier')
      .in(
        'tier',
        // keep strict: only count tiers we recognize
        ['pro', 'premium']
      )
      .limit(100000);

    const resolvedTierByUserId = new Map<string, string>();
    for (const r of subs || []) {
      const uid = String((r as any).user_id || '');
      const t = String((r as any).tier || '');
      if (!uid || !t) continue;
      resolvedTierByUserId.set(uid, t);
    }
    // beta overrides (avoid iterating MapIterator for older TS targets)
    betaTierByUserId.forEach((t, uid) => {
      if (t) resolvedTierByUserId.set(uid, t);
    });

    let proCount = 0;
    let premiumCount = 0;
    resolvedTierByUserId.forEach((t) => {
      if (t === 'pro') proCount++;
      if (t === 'premium') premiumCount++;
    });

    return NextResponse.json({
      ok: true,
      usersCount: usersCount ?? 0,
      waitlistCount: waitlistCount ?? 0,
      active7dCount: active7dUserIds.size,
      proCount,
      premiumCount,
      redeemsCount: redeemsCount ?? 0,
      parentBuysCount: parentBuysCount ?? 0,
    });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

// Manual refresh for the materialized view used by streak/reviews (user_daily_study_stats_mv).
// This exists because MVs don't auto-refresh.
export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const supabase = getServiceClient();
    const { error } = await (supabase as any).rpc('refresh_user_daily_study_stats_mv', {});
    // If the RPC doesn't exist (or MV isn't installed), don't hard-fail the dashboard.
    // The API routes can fall back to live card_reviews computations.
    if (error) {
      const msg = String(error.message || '');
      const looksLikeMissing =
        msg.toLowerCase().includes('does not exist') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('schema cache');
      if (!looksLikeMissing) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, warning: error.message });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

