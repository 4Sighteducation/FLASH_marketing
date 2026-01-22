import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';
import { sendSendGridEmail } from '../../../../../lib/server/sendgrid';
import { renderProTrialUnlockedEmail } from '../../../../../lib/emails/proTrialUnlockedEmail';

export const runtime = 'nodejs';

function toFirstNameFromProfile(profile: any): string | null {
  const s = String(profile?.username || profile?.name || profile?.full_name || '').trim();
  if (!s) return null;
  const first = s.split(/\s+/)[0]?.trim();
  if (!first || first.includes('@')) return null;
  return first;
}

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const body = await request.json().catch(() => ({}));
    const daysRaw = Number(body?.days ?? 30);
    const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(180, Math.floor(daysRaw))) : 30;
    const dryRun = body?.dry_run === true;
    const sendEmail = body?.send_email === true;
    const limitRaw = body?.limit == null ? null : Number(body?.limit);
    const limit = limitRaw == null ? null : Math.max(1, Math.min(2000, Math.floor(limitRaw)));

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@fl4shcards.com';
    const fromName = 'FL4SH';
    const subject = String(body?.subject || `FL4SH Pro unlocked for ${days} days ⚡`).trim().slice(0, 120);

    const supabase = getServiceClient();

    const results: Array<{ user_id: string; email?: string; action: string; ok: boolean; error?: string }> = [];
    let processed = 0;

    // Page through auth users (small scale; safe)
    const perPage = 200;
    const maxPages = 50;
    for (let page = 1; page <= maxPages; page++) {
      if (limit != null && processed >= limit) break;
      const { data, error } = await (supabase as any).auth.admin.listUsers({ page, perPage });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const authUsers: any[] = data?.users || [];
      if (authUsers.length === 0) break;

      const ids = authUsers.map((u: any) => String(u?.id || '')).filter(Boolean);
      if (ids.length === 0) continue;

      // Resolve current tier: beta_access overrides user_subscriptions
      const [{ data: betas }, { data: subs }, { data: profiles }] = await Promise.all([
        supabase.from('beta_access').select('user_id,tier,expires_at').in('user_id', ids),
        supabase.from('user_subscriptions').select('user_id,tier,expires_at').in('user_id', ids),
        supabase.from('users').select('id,username,name,full_name').in('id', ids),
      ]);
      const betaById = new Map<string, any>();
      for (const b of betas || []) betaById.set(String((b as any).user_id || ''), b);
      const subById = new Map<string, any>();
      for (const s of subs || []) subById.set(String((s as any).user_id || ''), s);
      const profileById = new Map<string, any>();
      for (const p of profiles || []) profileById.set(String((p as any).id || ''), p);

      for (const u of authUsers) {
        if (limit != null && processed >= limit) break;
        const userId = String(u?.id || '');
        const email = String(u?.email || '').trim().toLowerCase();
        if (!userId || !email || !email.includes('@')) continue;

        const beta = betaById.get(userId);
        const sub = subById.get(userId);
        const currentTier = String(beta?.tier || sub?.tier || 'free').toLowerCase();

        // Target legacy free users only
        if (currentTier !== 'free') continue;

        processed++;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        try {
          if (!dryRun) {
            await supabase.from('beta_access').upsert({
              user_id: userId,
              email,
              tier: 'pro',
              expires_at: expiresAt,
              note: `legacy_pro_trial_${days}d`,
              updated_at: new Date().toISOString(),
            });
          }

          if (sendEmail) {
            const profile = profileById.get(userId);
            const firstName = toFirstNameFromProfile(profile);
            const html = renderProTrialUnlockedEmail({ name: firstName || null, days });
            if (!dryRun) {
              await sendSendGridEmail({ to: email, subject, html, fromEmail, fromName });
            }
          }

          results.push({ user_id: userId, email, action: sendEmail ? 'grant+email' : 'grant', ok: true });
        } catch (e: any) {
          results.push({ user_id: userId, email, action: sendEmail ? 'grant+email' : 'grant', ok: false, error: String(e?.message || e) });
        }
      }

      if (authUsers.length < perPage) break;
    }

    const ok = results.filter((r) => r.ok).length;
    const failed = results.length - ok;
    return NextResponse.json({ ok: true, dryRun, days, sendEmail, attempted: results.length, success: ok, failed, results });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

