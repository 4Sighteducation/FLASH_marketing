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
    const { data: activeRows } = await supabase
      .from('user_daily_study_stats_mv')
      .select('user_id,study_date')
      .gte('study_date', since)
      .limit(100000);
    const active7dUserIds = new Set((activeRows || []).map((r: any) => String(r.user_id || '')).filter(Boolean));

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

