import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../../lib/server/adminApi';

function randomCode(groups = 4, groupLen = 4): { pretty: string; normalized: string } {
  // Base32-ish alphabet (no 0/1/O/I to reduce confusion)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(groups * groupLen);
  crypto.getRandomValues(bytes);
  let raw = '';
  for (const b of bytes) raw += alphabet[b % alphabet.length];
  const parts: string[] = [];
  for (let i = 0; i < groups; i++) parts.push(raw.slice(i * groupLen, (i + 1) * groupLen));
  const pretty = parts.join('-');
  return { pretty, normalized: pretty.replace(/-/g, '') };
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

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const body = await request.json().catch(() => ({}));
    const expiresAtIso = body?.expires_at ? new Date(body.expires_at).toISOString() : null;
    const expiresAt = expiresAtIso ? new Date(expiresAtIso) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const supabase = getServiceClient();
    const userId = params.userId;

    const { data: uRes, error: uErr } = await supabase.auth.admin.getUserById(userId);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
    const email = uRes?.user?.email || null;
    if (!email) return NextResponse.json({ error: 'User has no email (cannot send code)' }, { status: 400 });

    // Create a one-time Pro code. Store normalized (no dashes).
    let created: { pretty: string; normalized: string } | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const c = randomCode();
      const { error } = await supabase.from('access_codes').insert({
        code: c.normalized,
        tier: 'pro',
        expires_at: expiresAt.toISOString(),
        max_uses: 1,
        uses_count: 0,
        note: `admin_send:${userId}`,
      });
      if (!error) {
        created = c;
        break;
      }
    }
    if (!created) return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });

    // If they exist on the marketing waitlist, store the pretty code + mark sent.
    try {
      await supabase
        .from('waitlist')
        .update({
          early_access_code: created.pretty,
          early_access_code_created_at: new Date().toISOString(),
          early_access_code_sent_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase());
    } catch {
      // non-fatal
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@fl4shcards.com';
    const fromName = 'FL4SH Team';
    const subject = 'Your FL4SH Pro access code';

    const html = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Your FL4SH Pro code</title>
        </head>
        <body style="margin:0;padding:0;background:#070A12;color:#E6EAF2;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Inter,Arial,sans-serif;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your FL4SH Pro access code is ready.</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070A12;padding:28px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background:#0B1020;">
                  <tr>
                    <td style="padding:22px 22px 14px 22px;text-align:center;">
                      <img src="https://www.fl4shcards.com/flash_assets/flash-logo-transparent.png" width="72" height="72" alt="FL4SH" style="display:block;margin:0 auto 10px auto;" />
                      <div style="font-size:22px;font-weight:800;letter-spacing:0.2px;">Your FL4SH Pro code</div>
                      <div style="margin-top:6px;font-size:14px;opacity:0.85;line-height:1.45;">Redeem this code in the app to unlock <strong>Pro</strong>.</div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 22px 18px 22px;">
                      <div style="height:1px;background:rgba(255,255,255,0.08);"></div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 22px 18px 22px;font-size:14px;line-height:1.6;">
                      <div style="font-weight:700;margin-bottom:6px;">How to redeem</div>
                      <ol style="margin:0 0 0 18px;padding:0;">
                        <li>Open the FL4SH app.</li>
                        <li>Go to <strong>Profile → Redeem code</strong>.</li>
                        <li>Paste the code below.</li>
                      </ol>

                      <div style="margin-top:14px;font-weight:700;">Your code</div>
                      <div style="margin-top:8px;padding:14px 14px;border-radius:14px;background:#070A12;border:1px solid rgba(255,255,255,0.10);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:18px;letter-spacing:1px;text-align:center;">
                        <strong>${created.pretty}</strong>
                      </div>

                      <div style="margin-top:14px;font-size:12px;opacity:0.75;line-height:1.5;">
                        This code expires on <strong>${expiresAt.toLocaleString()}</strong>.
                        <br />
                        If it doesn’t unlock immediately, close and reopen the app.
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:16px 22px 20px 22px;background:rgba(255,255,255,0.03);font-size:12px;opacity:0.75;line-height:1.5;text-align:center;">
                      FL4SH • Study Smarter • <a href="https://www.fl4shcards.com" style="color:#00F5FF;text-decoration:none;">fl4shcards.com</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await sendSendGridEmail({ to: email, subject, html, fromEmail, fromName });

    return NextResponse.json({ ok: true, email, code: created.pretty, expires_at: expiresAt.toISOString() });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : msg === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

