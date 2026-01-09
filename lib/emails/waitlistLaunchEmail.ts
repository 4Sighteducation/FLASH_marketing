const IOS_APP_STORE_URL = 'https://apps.apple.com/in/app/fl4sh-study-smarter/id6747457678';
const ANDROID_BETA_URL = 'https://www.fl4shcards.com/android-beta-testers/';
const LOGO_URL = 'https://www.fl4shcards.com/flashv2.png';

export const WHAT_TO_TEST_TEXT = `FL4SH — What to Test (quick checklist)

A) Getting started
- Onboarding: exam track selection makes sense (GCSE/A-Level + Scottish where relevant)
- Subject selection: easy to find subjects, search works, nothing missing
- Topic discovery: topic tree feels right, search relevance is good

B) Flashcards
- AI generation: quality + exam relevance across MCQ / Short Answer / Essay / Acronym
- Manual create/edit/delete: reliable saving and editing

C) Study (core loop)
- Start study session → answer → grade → next card (smooth, no weird jumps)
- Cards Due / Leitner: due counts update correctly and feel fair
- Card Bank vs Study Bank: is it clear without explanation?

D) Progress
- Progress updates after study; weak areas are obvious

E) Pro features (waitlisters should have Pro enabled)
- Past Papers: open papers/questions/mark schemes (where available)
- Timed practice: timer behaves, results make sense

F) Account + reliability
- Sign up / login / password reset works and errors are clear
- Performance: start-up, resume, navigation speed; any crashes

If something breaks, please share steps + a screenshot. Thank you!
`;

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
  if (!first) return null;
  // Avoid weirdly greeting with an email
  if (first.includes('@')) return null;
  return first;
}

export function renderWaitlistLaunchEmail(params: { name?: string | null }) {
  const firstName = firstNameFrom(params.name);
  const greeting = firstName ? `Hi ${esc(firstName)},` : `Hi there,`;

  // Keep copy punchy; use attachment for full testing list.
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>FL4SH early access</title>
    <!--[if mso]>
      <style type="text/css">
        body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
      </style>
    <![endif]-->
  </head>
  <body style="margin:0; padding:0; background:#0a0f1e;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Your FL4SH early access is ready — download now.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0f1e;">
      <tr>
        <td align="center" style="padding:28px 16px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px;">

            <tr>
              <td style="padding:10px 8px 0 8px;">
                <img src="${LOGO_URL}" width="56" height="56" alt="FL4SH" style="display:block; border:0; outline:none; text-decoration:none;" />
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
                  FL4SH is live — and you’ve got Pro
                </div>
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#cbd5e1; font-weight:700; font-size:14px; line-height:1.6; margin-top:10px;">
                  Built from official UK exam specifications (GCSE/A‑Level) so your revision maps to what you’ll actually be tested on.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 8px 0 8px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:0 10px 10px 0;">
                      <a href="${IOS_APP_STORE_URL}"
                         style="display:inline-block; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; font-weight:900; font-size:14px; color:#0b1020; text-decoration:none;
                                background:linear-gradient(90deg,#00E5FF,#FF4FD8); padding:12px 16px; border-radius:12px;">
                        Download on iPhone / iPad →
                      </a>
                    </td>
                    <td style="padding:0 0 10px 0;">
                      <a href="${ANDROID_BETA_URL}"
                         style="display:inline-block; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; font-weight:900; font-size:14px; color:#00F5FF; text-decoration:none;
                                background:rgba(0,245,255,0.08); border:1px solid rgba(0,245,255,0.25); padding:12px 16px; border-radius:12px;">
                        Android beta testers →
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#94a3b8; font-weight:700; font-size:12px; line-height:1.55;">
                  Android users: join the beta to get the latest build before Play Store.
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
                        What makes FL4SH different
                      </div>
                      <ul style="margin:10px 0 0 18px; padding:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#cbd5e1; font-weight:700; font-size:14px; line-height:1.6;">
                        <li>Specification-driven topics (no guessing, no filler)</li>
                        <li>AI flashcards with exam context</li>
                        <li>Spaced repetition (5‑Box Leitner)</li>
                        <li>Past Papers + exam technique (Pro)</li>
                      </ul>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 8px 0 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#cbd5e1; font-weight:800; font-size:14px; line-height:1.6;">
                  We’ve attached a simple <b>“What to Test”</b> checklist. If anything feels off, just reply with a screenshot.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 8px 18px 8px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#64748b; font-weight:700; font-size:11px; line-height:1.6;">
                  You’re receiving this because you joined the FL4SH waitlist. If you’d rather not get emails, reply “unsubscribe”.
                  <br/>
                  Links:
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

