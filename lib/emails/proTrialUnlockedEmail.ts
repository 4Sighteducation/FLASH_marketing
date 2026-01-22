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

export function renderProTrialUnlockedEmail(params: { name?: string | null; days: number }) {
  const firstName = firstNameFrom(params.name);
  const greeting = firstName ? `Hi ${esc(firstName)},` : `Hi there,`;
  const days = Number(params.days) || 30;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>FL4SH Pro unlocked</title>
    <!--[if mso]>
      <style type="text/css">
        body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
      </style>
    <![endif]-->
  </head>
  <body style="margin:0; padding:0; background:#0a0f1e;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      FL4SH Pro is unlocked for you.
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
                  We’ve unlocked Pro for ${days} days
                </div>
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#cbd5e1; font-weight:700; font-size:14px; line-height:1.6; margin-top:10px;">
                  Open the app to access Pro features straight away. If it doesn’t update immediately, fully sign out and sign back in.
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

