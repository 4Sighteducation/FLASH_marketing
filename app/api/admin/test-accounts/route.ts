import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../lib/server/adminApi';

const TEST_ACCOUNTS: Array<{ email: string; tier: 'free' | 'premium' | 'pro' }> = [
  { email: 'appletester@fl4sh.cards', tier: 'pro' },
  { email: 'stu1@fl4sh.cards', tier: 'free' },
  { email: 'stu2@fl4sh.cards', tier: 'premium' },
  { email: 'stu3@fl4sh.cards', tier: 'pro' },
];

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === 'string' && body.password.length >= 8 ? body.password : null;
    if (!password) return NextResponse.json({ error: 'Password (>= 8 chars) required' }, { status: 400 });

    const supabase = getServiceClient();
    const created: any[] = [];

    for (const acct of TEST_ACCOUNTS) {
      // Create or fetch user
      let userId: string | null = null;

      const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = (existing?.users || []).find((u: any) => (u.email || '').toLowerCase() === acct.email.toLowerCase());
      if (found) {
        userId = found.id;
        // Reset password if requested (optional but convenient)
        await supabase.auth.admin.updateUserById(userId, { password } as any);
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email: acct.email,
          password,
          email_confirm: true,
        } as any);
        if (error) throw error;
        userId = data.user?.id || null;
      }

      if (!userId) continue;

      // Grant tier via user_subscriptions with far-future expiry for paid tiers
      const expires_at = acct.tier === 'free' ? null : '2035-01-01T00:00:00Z';
      await supabase.from('user_subscriptions').upsert({
        user_id: userId,
        tier: acct.tier,
        expires_at,
        updated_at: new Date().toISOString(),
      });

      created.push({ email: acct.email, user_id: userId, tier: acct.tier, expires_at });
    }

    return NextResponse.json({ ok: true, accounts: created });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}






