'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../../../lib/adminClient';

type FeedbackRow = {
  id: number;
  created_at: string | null;
  survey_key: string | null;
  status: string | null;
  user_id: string | null;
  answers: any;
  meta: any;
};

type DetailResponse = { row: FeedbackRow };

function fmt(dt: string | null): string {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function AdminFeedbackDetailPage({ params }: { params: { id: string } }) {
  const id = String(params?.id || '');
  const [row, setRow] = useState<FeedbackRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await adminFetch<DetailResponse>(`/api/admin/feedback/${encodeURIComponent(id)}`);
        setRow(res.row);
      } catch (e: any) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div><p>Loading…</p></div>;
  if (err) return <div style={{ color: '#FF4FD8', fontWeight: 900 }}>{err}</div>;
  if (!row) return <div style={{ color: '#94A3B8' }}>Not found.</div>;

  const a = (row.answers || {}) as any;

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">📝 Feedback #{row.id}</h2>
        <a className="action-button" href="/admin/feedback">← Back</a>
      </div>

      <div className="stat-card" style={{ display: 'grid', gap: 8 }}>
        <div style={{ color: '#94A3B8', fontWeight: 800 }}>
          {fmt(row.created_at)} • survey_key: <span style={{ color: '#E2E8F0' }}>{row.survey_key || '—'}</span> • status:{' '}
          <span style={{ color: '#E2E8F0' }}>{row.status || '—'}</span>
        </div>
        <div style={{ color: '#94A3B8', fontWeight: 800 }}>
          Name: <span style={{ color: '#E2E8F0' }}>{a.participant_name || '—'}</span> • Email:{' '}
          <span style={{ color: '#E2E8F0' }}>{a.participant_email || '—'}</span> • Voucher:{' '}
          <span style={{ color: '#E2E8F0' }}>{a.claim_voucher === true ? 'Yes' : a.claim_voucher === false ? 'No' : '—'}</span>
        </div>
      </div>

      <div className="stat-card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ fontWeight: 900, color: '#E2E8F0' }}>Answers (JSON)</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#E2E8F0' }}>
          {JSON.stringify(row.answers || {}, null, 2)}
        </pre>
      </div>

      <div className="stat-card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ fontWeight: 900, color: '#E2E8F0' }}>Meta (JSON)</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#E2E8F0' }}>
          {JSON.stringify(row.meta || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}

