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

function msFromIso(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(String(iso));
  return Number.isFinite(ms) ? ms : null;
}

async function selectUserSubscriptions(supabase: any) {
  const tries = [
    'user_id,tier,expires_at,source,platform,purchase_token,purchased_at,started_at,trial_used_at,updated_at',
    'user_id,tier,expires_at,source,platform,purchase_token,purchased_at,updated_at',
    'user_id,tier,expires_at,source,updated_at',
    'user_id,tier,expires_at',
  ];
  for (const sel of tries) {
    const { data, error } = await supabase.from('user_subscriptions').select(sel).limit(100000);
    if (!error) return data || [];
  }
  return [];
}

function isPaidAppSubscription(sub?: any | null) {
  if (!sub) return false;
  const tier = String(sub?.tier || '').toLowerCase();
  if (tier !== 'pro' && tier !== 'premium') return false;
  const source = String(sub?.source || '').toLowerCase();
  if (source === 'trial') return false;

  const platform = String(sub?.platform || '').toLowerCase();
  const purchaseToken = sub?.purchase_token ? String(sub.purchase_token) : '';

  const expiresAtMs = msFromIso(sub?.expires_at || null);
  const active = expiresAtMs == null ? true : expiresAtMs > Date.now();
  if (!active) return false;

  const looksPaid =
    !!purchaseToken ||
    (platform && platform !== 'server') ||
    ['revenuecat', 'iap', 'app_store', 'play_store', 'stripe'].includes(source);
  return looksPaid;
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

    // Trial stats + paid stats (best-effort)
    const nowMs = Date.now();
    const in7Ms = nowMs + 7 * 24 * 60 * 60 * 1000;
    const in3Ms = nowMs + 3 * 24 * 60 * 60 * 1000;

    // Native trials (source='trial') + legacy bulk trials (beta_access note legacy_pro_trial_...)
    const trialEndsByUserId = new Map<string, number>();

    // Native trial rows (user_subscriptions)
    const subsAll = await selectUserSubscriptions(supabase);
    for (const s of subsAll || []) {
      const src = String((s as any)?.source || '').toLowerCase();
      if (src !== 'trial') continue;
      const uid = String((s as any)?.user_id || '');
      const expMs = msFromIso((s as any)?.expires_at || null);
      if (!uid || !expMs) continue;
      trialEndsByUserId.set(uid, expMs);
    }

    // Legacy trials (beta_access)
    const { data: legacyTrials } = await supabase
      .from('beta_access')
      .select('user_id,expires_at,note')
      .like('note', 'legacy_pro_trial_%')
      .limit(100000);
    for (const b of legacyTrials || []) {
      const uid = String((b as any)?.user_id || '');
      const expMs = msFromIso((b as any)?.expires_at || null);
      if (!uid || !expMs) continue;
      trialEndsByUserId.set(uid, expMs);
    }

    let trialActiveCount = 0;
    let trialEnding7dCount = 0;
    let trialEnding3dCount = 0;
    trialEndsByUserId.forEach((expMs) => {
      if (expMs > nowMs) {
        trialActiveCount++;
        if (expMs <= in7Ms) trialEnding7dCount++;
        if (expMs <= in3Ms) trialEnding3dCount++;
      }
    });

    // Paid active (from user_subscriptions heuristic)
    let paidAppActiveCount = 0;
    for (const s of subsAll || []) {
      if (isPaidAppSubscription(s)) paidAppActiveCount++;
    }

    const paidShareOfProLike =
      paidAppActiveCount + trialActiveCount > 0 ? paidAppActiveCount / (paidAppActiveCount + trialActiveCount) : 0;

    return NextResponse.json({
      ok: true,
      usersCount: usersCount ?? 0,
      waitlistCount: waitlistCount ?? 0,
      active7dCount: active7dUserIds.size,
      proCount,
      premiumCount,
      redeemsCount: redeemsCount ?? 0,
      parentBuysCount: parentBuysCount ?? 0,
      trialActiveCount,
      trialEnding7dCount,
      trialEnding3dCount,
      paidAppActiveCount,
      paidShareOfProLike,
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

