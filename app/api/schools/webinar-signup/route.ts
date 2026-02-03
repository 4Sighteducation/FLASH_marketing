import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '../../../../lib/server/adminApi';
import { sendSendGridEmail } from '../../../../lib/server/sendgrid';
import { isAllowedOrigin, validateHoneypotAndTiming, verifyTurnstileToken } from '../../../../lib/server/turnstile';

export const runtime = 'nodejs';

const DEFAULT_SCHOOL_WEBINAR_BOOKING_URL = 'https://calendly.com/vespaacademy/student-workshop-booking';

function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeShort(s: any, max: number): string | null {
  const v = String(s || '').trim();
  if (!v) return null;
  return v.length > max ? v.slice(0, max) : v;
}

function normalizeNameForMatch(s: string): string {
  return String(s || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function isUniqueViolation(e: any): boolean {
  const code = e?.code || e?.cause?.code;
  // Postgres unique_violation
  return code === '23505';
}

function renderBookingEmail(params: {
  staffName: string;
  bookingUrl: string;
  marketingUrl: string;
  vespaUrl: string;
}) {
  const name = params.staffName.trim();
  const greeting = name ? `Hi ${esc(name.split(/\s+/)[0] || name)},` : 'Hi there,';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Free school webinar — Supercharged Revision</title>
    <!--[if mso]>
      <style type="text/css">
        body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
      </style>
    <![endif]-->
  </head>
  <body style="margin:0; padding:0; background:#0a0f1e;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Your free 60-minute “Supercharged Revision” webinar booking link is inside.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0f1e;">
      <tr>
        <td align="center" style="padding:28px 16px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px;">

            <tr>
              <td align="center" style="padding:8px 8px 0 8px;">
                <img src="https://www.fl4shcards.com/flash_assets/flash-logo-transparent.png" width="96" alt="FL4SH" style="display:block; border:0; outline:none; text-decoration:none; width:96px; height:auto; margin:0 auto;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:10px 8px 0 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#94a3b8; font-weight:700; font-size:12px; line-height:1.6;">
                  Brought to you by <a href="${esc(params.vespaUrl)}" style="color:#00F5FF; text-decoration:none; font-weight:900;">VESPA Academy</a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 8px 0 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#e2e8f0; font-weight:900; font-size:16px;">
                  ${greeting}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:10px 8px 0 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#ffffff; font-weight:900; font-size:22px; line-height:1.25;">
                  Your free “Supercharged Revision” webinar
                </div>
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#cbd5e1; font-weight:700; font-size:14px; line-height:1.65; margin-top:10px;">
                  Thanks for registering your interest in <b>FL4SH</b>. As a thank-you, your school qualifies for a
                  <b>free 60-minute student revision webinar</b> (usually <b>£350</b>) delivered by VESPA Academy.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 8px 0 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);">
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#ffffff; font-weight:900; font-size:15px;">
                        What students will learn
                      </div>
                      <ul style="margin:10px 0 0 18px; padding:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#cbd5e1; font-weight:700; font-size:14px; line-height:1.7;">
                        <li>Highly effective study + revision strategies (fast wins students actually use)</li>
                        <li>How to plan revision for maximum impact (not just “do more”)</li>
                        <li>How to remember more, for longer (retrieval + spacing done properly)</li>
                        <li>Practical routines students can start immediately</li>
                      </ul>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 8px 0 8px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:0 0 10px 0;">
                      <a href="${esc(params.bookingUrl)}"
                         style="display:inline-block; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; font-weight:900; font-size:14px; color:#0b1020; text-decoration:none;
                                background:linear-gradient(90deg,#00E5FF,#FF4FD8); padding:12px 16px; border-radius:12px;">
                        Book your free webinar slot →
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#94a3b8; font-weight:700; font-size:12px; line-height:1.6;">
                  If the button doesn’t work, copy and paste: <span style="color:#00F5FF;">${esc(params.bookingUrl)}</span>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 8px 0 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#cbd5e1; font-weight:800; font-size:14px; line-height:1.6;">
                  You’ll also receive launch updates for FL4SH (GCSE/A‑Level revision built from official exam specifications).
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 8px 18px 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#64748b; font-weight:700; font-size:11px; line-height:1.6;">
                  FL4SH marketing page: <a href="${esc(params.marketingUrl)}" style="color:#00F5FF;">${esc(params.marketingUrl)}</a>
                  <br/>
                  If you’d rather not receive emails, reply “unsubscribe”.
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const turnstileToken = body?.turnstileToken;
    const website = body?.website;
    const formStartedAt = body?.formStartedAt;

    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const timingError = validateHoneypotAndTiming({ website, formStartedAt: Number(formStartedAt) });
    if (timingError) {
      return NextResponse.json({ error: timingError }, { status: 403 });
    }

    if (!turnstileToken) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }

    const verify = await verifyTurnstileToken({
      token: String(turnstileToken),
      ip: request.headers.get('x-forwarded-for'),
    });

    if (!verify?.success) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }

    const staffName = normalizeShort(body?.name, 120);
    const staffEmail = normalizeShort(body?.email, 254)?.toLowerCase() || null;
    const staffRole = normalizeShort(body?.role, 120);
    const establishmentName = normalizeShort(body?.establishment, 180);

    if (!staffName) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!staffEmail || !looksLikeEmail(staffEmail)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const bookingUrl =
      String(process.env.SCHOOL_WEBINAR_BOOKING_URL || process.env.VESPA_WEBINAR_BOOKING_URL || '').trim() ||
      DEFAULT_SCHOOL_WEBINAR_BOOKING_URL;
    const marketingUrl = 'https://www.fl4shcards.com/schools';
    const vespaUrl = 'https://www.vespa.academy/';

    const meta = {
      source: 'fl4shcards.com/schools',
      ip: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
      referer: request.headers.get('referer') || null,
      submittedAtServer: new Date().toISOString(),
    };

    const supabase = getServiceClient();

    // Attempt to match to an existing establishment row.
    let establishmentId: string | null = null;
    if (establishmentName) {
      const normalized = normalizeNameForMatch(establishmentName);
      const { data } = await supabase
        .from('establishments')
        .select('id')
        .eq('normalized_name', normalized)
        .limit(1)
        .maybeSingle();
      establishmentId = (data as any)?.id || null;
    }

    let rowId: string | null = null;
    let alreadySignedUp = false;

    try {
      const { data, error } = await supabase
        .from('school_webinar_signups')
        .insert({
          staff_name: staffName,
          staff_email: staffEmail,
          staff_role: staffRole,
          establishment_name: establishmentName,
          establishment_id: establishmentId,
          source: 'schools_webinar_signup',
          meta,
          booking_link_status: 'pending',
        })
        .select('id,booking_link_status')
        .single();

      if (error) throw error;
      rowId = (data as any)?.id || null;
    } catch (e: any) {
      if (!isUniqueViolation(e)) throw e;
      alreadySignedUp = true;
    }

    // If already exists, fetch row so we can avoid double-sending too much.
    let existingStatus: string | null = null;
    if (alreadySignedUp) {
      const { data } = await supabase
        .from('school_webinar_signups')
        .select('id,booking_link_status')
        .eq('staff_email', staffEmail)
        .single();
      rowId = (data as any)?.id || null;
      existingStatus = (data as any)?.booking_link_status || null;
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@fl4shcards.com';
    const fromName = 'FL4SH × VESPA Academy';
    const notifyTo = process.env.SCHOOL_WEBINAR_NOTIFY_EMAIL || 'tony@vespa.academy';

    // Send booking link email (idempotent-ish).
    // - If first time: send.
    // - If duplicate: only send if we haven't marked it sent yet.
    const shouldSendBookingEmail = !alreadySignedUp || existingStatus !== 'sent';

    if (shouldSendBookingEmail) {
      const html = renderBookingEmail({ staffName, bookingUrl, marketingUrl, vespaUrl });
      await sendSendGridEmail({
        to: staffEmail,
        subject: 'Your free school webinar: Supercharged Revision (booking link)',
        html,
        fromEmail,
        fromName,
      });

      if (rowId) {
        await supabase
          .from('school_webinar_signups')
          .update({ booking_link_status: 'sent', booking_link_sent_at: new Date().toISOString() })
          .eq('id', rowId);
      }
    }

    // Notify admin (best-effort)
    try {
      const html = `
        <h3>New school webinar signup</h3>
        <p><strong>Name:</strong> ${esc(staffName)}</p>
        <p><strong>Email:</strong> ${esc(staffEmail)}</p>
        <p><strong>Role:</strong> ${esc(staffRole || '(not provided)')}</p>
        <p><strong>Establishment:</strong> ${esc(establishmentName || '(not provided)')}</p>
        <p><strong>Already signed up:</strong> ${alreadySignedUp ? 'YES' : 'No'}</p>
        <p><strong>Row ID:</strong> ${esc(rowId || '(unknown)')}</p>
        <hr/>
        <p><strong>Booking URL:</strong> <a href="${esc(bookingUrl)}">${esc(bookingUrl)}</a></p>
        <p><em>Received: ${esc(new Date().toLocaleString())}</em></p>
      `;
      await sendSendGridEmail({
        to: notifyTo,
        subject: `School webinar signup: ${staffEmail}${alreadySignedUp ? ' (repeat)' : ''}`,
        html,
        fromEmail,
        fromName: 'FL4SH Schools',
      });
    } catch (e) {
      // non-fatal
      console.error('[schools/webinar-signup] admin notify failed (non-fatal):', e);
    }

    return NextResponse.json({
      ok: true,
      alreadySignedUp,
      emailed: shouldSendBookingEmail,
    });
  } catch (e: any) {
    console.error('[schools/webinar-signup] error', e);
    return NextResponse.json({ error: e?.message || 'Something went wrong' }, { status: 500 });
  }
}

