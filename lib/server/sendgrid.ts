type SendGridAttachment = {
  contentBase64: string;
  filename: string;
  type?: string; // MIME type
  disposition?: 'attachment' | 'inline';
  contentId?: string;
};

export async function sendSendGridEmail(params: {
  to: string;
  subject: string;
  html: string;
  fromEmail: string;
  fromName: string;
  attachments?: SendGridAttachment[];
}) {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendGridApiKey) throw new Error('SENDGRID_API_KEY not configured');

  const attachments =
    (params.attachments || []).map((a) => ({
      content: a.contentBase64,
      filename: a.filename,
      type: a.type,
      disposition: a.disposition || 'attachment',
      content_id: a.contentId,
    })) || [];

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
      ...(attachments.length ? { attachments } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid error: ${res.status} ${text}`);
  }
}

