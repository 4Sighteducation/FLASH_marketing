import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';
import { sendSendGridEmail, sendSendGridTemplateEmail } from '../../../../../lib/server/sendgrid';
import { renderWaitlistLaunchEmail, WHAT_TO_TEST_TEXT } from '../../../../../lib/emails/waitlistLaunchEmail';

export const runtime = 'nodejs';

const LOGO_URL = 'https://www.fl4sh.cards/assets/assets/flash-logo-transparent.4bcac0acf4ae33723b9013d3f00e8e27.png';
const WHAT_TO_TEST_URL = 'https://www.fl4shcards.com/what-to-test.txt';

function toFirstNameFromProfile(profile: any): string | null {
  const s = String(profile?.username || profile?.name || profile?.full_name || '').trim();
  if (!s) return null;
  const first = s.split(/\s+/)[0]?.trim();
  if (!first || first.includes('@')) return null;
  return first;
}

function attachmentForWhatToTest() {
  const base64 = Buffer.from(WHAT_TO_TEST_TEXT, 'utf8').toString('base64');
  return {
    contentBase64: base64,
    filename: 'FL4SH - What to Test.txt',
    type: 'text/plain',
    disposition: 'attachment' as const,
  };
}

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const body = await request.json().catch(() => ({}));
    const mode = String(body?.mode || '').trim(); // 'preview' | 'batch'
    const previewTo = String(body?.preview_to || '').trim().toLowerCase();
    const batchLimit = Math.min(Math.max(Number(body?.limit || 100) || 100, 1), 500);
    const dryRun = body?.dry_run === true;

    const subject = String(body?.subject || 'Your FL4SH early access is ready ⚡').trim().slice(0, 120);
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@fl4shcards.com';
    const fromName = 'FL4SH';
    const templateId = String(process.env.SENDGRID_WAITLIST_TEMPLATE || '').trim();

    const supabase = getServiceClient();

    if (mode === 'preview') {
      if (!previewTo || !previewTo.includes('@')) {
        return NextResponse.json({ error: 'preview_to (valid email) is required' }, { status: 400 });
      }
      if (!dryRun) {
        if (templateId) {
          await sendSendGridTemplateEmail({
            to: previewTo,
            subject: `[PREVIEW] ${subject}`,
            templateId,
            dynamicTemplateData: {
              first_name: 'Tony',
              ios_app_store_url: 'https://apps.apple.com/in/app/fl4sh-study-smarter/id6747457678',
              android_beta_url: 'https://www.fl4shcards.com/android-beta-testers/',
              pro_enabled: true,
              logo_url: LOGO_URL,
              what_to_test_url: WHAT_TO_TEST_URL,
            },
            fromEmail,
            fromName,
            attachments: [attachmentForWhatToTest()],
          });
        } else {
          const html = renderWaitlistLaunchEmail({ name: 'Tony' });
          await sendSendGridEmail({
            to: previewTo,
            subject: `[PREVIEW] ${subject}`,
            html,
            fromEmail,
            fromName,
            attachments: [attachmentForWhatToTest()],
          });
        }
      }
      return NextResponse.json({ ok: true, mode: 'preview', dryRun });
    }

    if (mode !== 'batch') {
      return NextResponse.json({ error: "mode must be 'preview' or 'batch'" }, { status: 400 });
    }

    // Batch send only to not-notified waitlist rows
    const { data: waitlistRows, error } = await supabase
      .from('waitlist')
      .select('id,email,notified')
      .eq('notified', false)
      .order('created_at', { ascending: true })
      .limit(batchLimit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (waitlistRows || []).filter((r: any) => r?.email);
    const emails = rows.map((r: any) => String(r.email).toLowerCase());

    // Pull names from public.users where available
    const { data: profiles } = await supabase.from('users').select('email,username,name,full_name').in('email', emails);
    const byEmail = new Map<string, any>();
    for (const p of profiles || []) byEmail.set(String((p as any).email || '').toLowerCase(), p);

    const results: Array<{ email: string; ok: boolean; error?: string }> = [];
    for (const r of rows) {
      const email = String(r.email).toLowerCase();
      const profile = byEmail.get(email);
      const firstName = toFirstNameFromProfile(profile);
      try {
        if (!dryRun) {
          if (templateId) {
            await sendSendGridTemplateEmail({
              to: email,
              subject,
              templateId,
              dynamicTemplateData: {
                first_name: firstName || '',
                ios_app_store_url: 'https://apps.apple.com/in/app/fl4sh-study-smarter/id6747457678',
                android_beta_url: 'https://www.fl4shcards.com/android-beta-testers/',
                pro_enabled: true,
                logo_url: LOGO_URL,
                what_to_test_url: WHAT_TO_TEST_URL,
              },
              fromEmail,
              fromName,
              attachments: [attachmentForWhatToTest()],
            });
          } else {
            const html = renderWaitlistLaunchEmail({ name: firstName || null });
            await sendSendGridEmail({
              to: email,
              subject,
              html,
              fromEmail,
              fromName,
              attachments: [attachmentForWhatToTest()],
            });
          }
          if (r.id) {
            await supabase.from('waitlist').update({ notified: true }).eq('id', r.id);
          }
        }
        results.push({ email, ok: true });
      } catch (e: any) {
        results.push({ email, ok: false, error: String(e?.message || e) });
      }
    }

    const sent = results.filter((x) => x.ok).length;
    const failed = results.length - sent;

    return NextResponse.json({ ok: true, mode: 'batch', dryRun, attempted: results.length, sent, failed, results });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

