import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../../lib/server/adminApi';

async function findUserIdByEmail(supabase: ReturnType<typeof getServiceClient>, email: string): Promise<string | null> {
  // Supabase Admin API doesn't provide getUserByEmail; list + scan is ok at our scale.
  let page = 1;
  const perPage = 200;
  const maxPages = 20; // safety
  const needle = email.trim().toLowerCase();

  while (page <= maxPages) {
    // Typings vary by supabase-js version; listUsers exists at runtime on auth.admin.
    const { data, error } = await (supabase as any).auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users: any[] = data?.users || [];
    const match = users.find((u) => typeof u?.email === 'string' && u.email.toLowerCase() === needle);
    if (match?.id) return String(match.id);
    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

export async function POST(request: NextRequest, ctx: { params: { rowId: string } }) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const rowId = String(ctx?.params?.rowId || '').trim();
    if (!rowId) return NextResponse.json({ error: 'Missing rowId' }, { status: 400 });

    const supabase = getServiceClient();
    const { data: wl, error: wlErr } = await supabase.from('waitlist').select('*').eq('id', rowId).single();
    if (wlErr || !wl) return NextResponse.json({ error: wlErr?.message || 'Waitlist row not found' }, { status: 404 });

    const eligible = Boolean(wl.is_top_twenty) || Boolean(wl.auto_pro_enabled);
    if (!eligible) return NextResponse.json({ error: 'Waitlist row is not eligible for auto Pro.' }, { status: 400 });

    const email = String(wl.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Waitlist row missing email.' }, { status: 400 });

    const userId = await findUserIdByEmail(supabase, email);
    if (!userId) {
      return NextResponse.json(
        { error: 'User has not created an account with this email yet (or used Apple Hide-My-Email).' },
        { status: 404 }
      );
    }

    const days = Math.max(1, Math.min(3650, Number(wl.auto_pro_days || 365)));
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    // Prefer DB helper function if present; otherwise write tables directly.
    const rpc = await (supabase as any)
      .rpc('grant_pro_to_user', {
        p_user_id: userId,
        p_expires_at: expiresAt,
        p_source: 'waitlist_admin',
        p_note: `waitlist:${rowId}`,
      })
      .then((r) => r)
      .catch((e) => ({ error: { message: e?.message || 'RPC failed' } }));

    if (rpc?.error) {
      // Fallback: direct upserts
      const up1 = await supabase.from('user_subscriptions').upsert({
        user_id: userId,
        tier: 'pro',
        source: 'waitlist_admin',
        // user_subscriptions has a CHECK constraint; 'server' is not an allowed value.
        // Use 'web' for server-side writes.
        platform: 'web',
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      });
      if (up1.error) return NextResponse.json({ error: up1.error.message }, { status: 500 });

      const up2 = await supabase.from('beta_access').upsert({
        user_id: userId,
        tier: 'pro',
        expires_at: expiresAt,
        note: `waitlist:${rowId}`,
        updated_at: new Date().toISOString(),
      });
      if (up2.error) return NextResponse.json({ error: up2.error.message }, { status: 500 });
    }

    const { error: updErr } = await supabase
      .from('waitlist')
      .update({
        auto_pro_granted_at: new Date().toISOString(),
        auto_pro_granted_user_id: userId,
      })
      .eq('id', rowId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ success: true, userId, expiresAt });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

