import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '../../../../lib/server/adminApi';

function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendSendGridEmail(params: { to: string; subject: string; html: string; fromEmail: string; fromName: string }) {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendGridApiKey) throw new Error('SENDGRID_API_KEY not configured');

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: params.to }], subject: params.subject }],
      from: { email: params.fromEmail, name: params.fromName },
      tracking_settings: {
        click_tracking: { enable: false, enable_text: false },
        open_tracking: { enable: false },
      },
      content: [{ type: 'text/html', value: params.html }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid error: ${res.status} ${text}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const survey_key = String(body?.survey_key || '').trim();
    const answers = body?.answers || {};

    if (!survey_key || survey_key.length < 3 || survey_key.length > 64) {
      return NextResponse.json({ error: 'Invalid survey key' }, { status: 400 });
    }

    const participant_name = String(answers?.participant_name || '').trim();
    const claim_voucher = answers?.claim_voucher === true;
    const participant_email = String(answers?.participant_email || '').trim().toLowerCase();
    const consent = answers?.consent === true;

    if (!participant_name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!consent) return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
    if (claim_voucher && !looksLikeEmail(participant_email)) {
      return NextResponse.json({ error: 'Valid email is required to claim the voucher' }, { status: 400 });
    }

    const meta = {
      source: 'fl4shcards.com/tester-feedback',
      ip: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
      referer: request.headers.get('referer') || null,
      submittedAtServer: new Date().toISOString(),
      voucher: claim_voucher ? 'costa_10' : null,
    };

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('app_feedback')
      .insert({
        survey_key,
        user_id: null,
        answers,
        meta,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[tester-feedback] insert error', error);
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
    }

    const id = (data as any)?.id;

    // Email Tony on every submission (so you can send vouchers manually).
    const notifyTo = process.env.TESTER_FEEDBACK_NOTIFY_EMAIL || 'tony@vespa.academy';
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@fl4shcards.com';
    const fromName = 'FL4SH Feedback';

    try {
      const subject = `New tester feedback submission #${id}`;
      const html = `
        <h3>New tester feedback submission</h3>
        <p><strong>ID:</strong> ${id}</p>
        <p><strong>Name:</strong> ${escapeHtml(participant_name)}</p>
        <p><strong>Voucher requested:</strong> ${claim_voucher ? 'YES' : 'No'}</p>
        <p><strong>Email:</strong> ${escapeHtml(participant_email || '(not provided)')}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr/>
        <pre style="white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(
          JSON.stringify(answers || {}, null, 2)
        )}</pre>
      `;
      await sendSendGridEmail({ to: notifyTo, subject, html, fromEmail, fromName });
    } catch (e) {
      console.error('[tester-feedback] notify email failed (non-fatal):', e);
    }

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    console.error('[tester-feedback] fatal', e);
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

