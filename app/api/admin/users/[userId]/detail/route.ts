import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../../lib/server/adminApi';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const userId = String(params.userId || '');
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const supabase = getServiceClient();

    // Auth user
    const authRes: any = await (supabase as any).auth.admin.getUserById(userId);
    const authUser = authRes?.data?.user || null;

    const [{ data: profile }, { data: sub }, { data: beta }, { data: seen }, { data: daily }] = await Promise.all([
      supabase.from('users').select('id,email,username,primary_exam_type,secondary_exam_type,created_at').eq('id', userId).maybeSingle(),
      supabase.from('user_subscriptions').select('user_id,tier,expires_at').eq('user_id', userId).maybeSingle(),
      supabase.from('beta_access').select('user_id,tier,expires_at,note').eq('user_id', userId).maybeSingle(),
      supabase
        .from('user_last_seen')
        .select('user_id,last_seen_at,platform,app_version,build_version,device_model,os_name,os_version,locale,timezone,country')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_daily_study_stats_mv')
        .select('study_date,reviews_total,correct_total,incorrect_total,accuracy,xp_awarded_total')
        .eq('user_id', userId)
        .order('study_date', { ascending: false })
        .limit(30),
    ]);

    // Activation / monetization counts
    const [{ count: subjectsCount }, { count: cardsCount }, { count: redeemsCount }, { count: parentBuysCount }] =
      await Promise.all([
        supabase.from('user_subjects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('access_code_redemptions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('parent_claims').select('id', { count: 'exact', head: true }).eq('claimed_by', userId),
      ]);

    // Resolve tier with beta override
    const resolvedTier = (beta as any)?.tier || (sub as any)?.tier || null;
    const resolvedExpiresAt = (beta as any)?.expires_at || (sub as any)?.expires_at || null;
    const source = (beta as any)?.tier ? 'beta_access' : (sub as any)?.tier ? 'user_subscriptions' : null;

    return NextResponse.json({
      ok: true,
      auth: authUser
        ? {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            banned_until: authUser.banned_until,
            user_metadata: authUser.user_metadata || {},
          }
        : null,
      profile: profile || null,
      subscription: { tier: resolvedTier, expires_at: resolvedExpiresAt, source, beta_note: (beta as any)?.note || null },
      device: seen || null,
      activation: { subjects_count: subjectsCount ?? 0, cards_count: cardsCount ?? 0 },
      engagement_last_30d: daily || [],
      monetization: { redemptions_count: redeemsCount ?? 0, parent_purchases_count: parentBuysCount ?? 0 },
    });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

