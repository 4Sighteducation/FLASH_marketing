const FEEDBACK_URL = 'https://www.fl4shcards.com/tester-feedback';
const IOS_APP_STORE_URL = 'https://apps.apple.com/in/app/fl4sh-study-smarter/id6747457678';
const ANDROID_BETA_URL = 'https://www.fl4shcards.com/android-beta-testers/';
const LOGO_URL = 'https://www.fl4shcards.com/flashv2.png';

function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function firstNameFrom(input: string | null | undefined): string | null {
  const s = String(input || '').trim();
  if (!s) return null;
  const first = s.split(/\s+/)[0]?.trim();
  if (!first || first.includes('@')) return null;
  return first;
}

export function renderWaitlistFeedbackEmail(params: { name?: string | null }) {
  const firstName = firstNameFrom(params.name);
  const greeting = firstName ? `Hi ${esc(firstName)},` : `Hi there,`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>FL4SH feedback</title>
    <!--[if mso]>
      <style type="text/css">
        body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
      </style>
    <![endif]-->
  </head>
  <body style="margin:0; padding:0; background:#0a0f1e;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Quick feedback form — 2 minutes.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0f1e;">
      <tr>
        <td align="center" style="padding:28px 16px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px;">

            <tr>
              <td align="center" style="padding:18px 8px 0 8px;">
                <img src="${LOGO_URL}" width="110" alt="FL4SH" style="display:block; border:0; outline:none; text-decoration:none; width:110px; height:auto; margin:0 auto;" />
              </td>
            </tr>

            <tr>
              <td style="padding:14px 8px 0 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#e2e8f0; font-weight:900; font-size:16px;">
                  ${greeting}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:10px 8px 0 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#ffffff; font-weight:900; font-size:22px; line-height:1.25;">
                  Can you share quick feedback?
                </div>
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#cbd5e1; font-weight:700; font-size:14px; line-height:1.6; margin-top:10px;">
                  It takes ~2 minutes and massively helps us fix bugs + improve the study flow.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 8px 0 8px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:0 10px 10px 0;">
                      <a href="${FEEDBACK_URL}"
                         style="display:inline-block; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; font-weight:900; font-size:14px; color:#0b1020; text-decoration:none;
                                background:linear-gradient(90deg,#00E5FF,#FF4FD8); padding:12px 16px; border-radius:12px;">
                        Open feedback form →
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#94a3b8; font-weight:700; font-size:12px; line-height:1.55;">
                  Link: <a href="${FEEDBACK_URL}" style="color:#00F5FF;">${FEEDBACK_URL}</a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 8px 0 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#cbd5e1; font-weight:800; font-size:14px; line-height:1.6;">
                  If you hit a bug, replying with a screenshot is perfect.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 8px 18px 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#64748b; font-weight:700; font-size:11px; line-height:1.6;">
                  Download links:
                  <a href="${IOS_APP_STORE_URL}" style="color:#00F5FF;">iOS App Store</a> ·
                  <a href="${ANDROID_BETA_URL}" style="color:#00F5FF;">Android beta testers</a>
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

