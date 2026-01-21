import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';
import { sendSendGridEmail, sendSendGridTemplateEmail } from '../../../../../lib/server/sendgrid';
import { renderWaitlistFeedbackEmail } from '../../../../../lib/emails/waitlistFeedbackEmail';

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
    const userIds = Array.isArray(body?.user_ids) ? body.user_ids.map((x: any) => String(x || '').trim()).filter(Boolean) : [];
    if (userIds.length === 0) return NextResponse.json({ error: 'user_ids (non-empty array) is required' }, { status: 400 });

    const dryRun = body?.dry_run === true;
    const force = body?.force === true;
    const subject = String(body?.subject || 'Quick FL4SH feedback (2 mins) 🙏').trim().slice(0, 120);

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@fl4shcards.com';
    const fromName = 'FL4SH';
    const templateId = String(process.env.SENDGRID_WAITLIST_FEEDBACK_TEMPLATE || '').trim();

    const supabase = getServiceClient();

    // Profiles for names (public.users is keyed by id=user_id)
    const { data: profiles } = await supabase.from('users').select('id,username,name,full_name,email').in('id', userIds).limit(2000);
    const profileById = new Map<string, any>();
    for (const p of profiles || []) profileById.set(String((p as any).id || ''), p);

    // Existing email events to provide idempotency
    const { data: existingEvents } = await supabase
      .from('user_email_events')
      .select('user_id,type,status,sent_at')
      .in('user_id', userIds)
      .eq('type', 'feedback_request')
      .limit(5000);
    const existingByUserId = new Map<string, any>();
    for (const ev of existingEvents || []) existingByUserId.set(String((ev as any).user_id || ''), ev);

    const results: Array<{ user_id: string; email?: string; ok: boolean; skipped?: boolean; error?: string }> = [];
    for (const userId of userIds) {
      const existing = existingByUserId.get(userId);
      if (!force && existing?.status === 'sent') {
        results.push({ user_id: userId, ok: true, skipped: true });
        continue;
      }

      // Get auth email (source of truth)
      const authRes: any = await (supabase as any).auth.admin.getUserById(userId);
      const email = String(authRes?.data?.user?.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        results.push({ user_id: userId, ok: false, error: 'User has no email' });
        continue;
      }

      const profile = profileById.get(userId);
      const firstName = toFirstNameFromProfile(profile);

      // mark sending (best-effort)
      if (!dryRun) {
        await supabase
          .from('user_email_events')
          .upsert(
            { user_id: userId, email, type: 'feedback_request', status: 'sending', error: null, sent_at: null },
            { onConflict: 'user_id,type' }
          );
      }

      try {
        if (!dryRun) {
          if (templateId) {
            await sendSendGridTemplateEmail({
              to: email,
              subject,
              templateId,
              dynamicTemplateData: {
                first_name: firstName || '',
                feedback_url: 'https://www.fl4shcards.com/tester-feedback',
                logo_url: 'https://www.fl4shcards.com/flashv2.png',
              },
              fromEmail,
              fromName,
            });
          } else {
            const html = renderWaitlistFeedbackEmail({ name: firstName || null });
            await sendSendGridEmail({ to: email, subject, html, fromEmail, fromName });
          }

          await supabase
            .from('user_email_events')
            .upsert(
              { user_id: userId, email, type: 'feedback_request', status: 'sent', sent_at: new Date().toISOString(), error: null },
              { onConflict: 'user_id,type' }
            );
        }

        results.push({ user_id: userId, email, ok: true });
      } catch (e: any) {
        const errMsg = String(e?.message || e);
        if (!dryRun) {
          await supabase
            .from('user_email_events')
            .upsert({ user_id: userId, email, type: 'feedback_request', status: 'failed', error: errMsg }, { onConflict: 'user_id,type' });
        }
        results.push({ user_id: userId, email, ok: false, error: errMsg });
      }
    }

    const attempted = results.filter((r) => !r.skipped).length;
    const sent = results.filter((r) => r.ok && !r.skipped).length;
    const failed = results.filter((r) => !r.ok).length;
    const skipped = results.filter((r) => r.skipped).length;

    return NextResponse.json({ ok: true, dryRun, attempted, sent, failed, skipped, results });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

