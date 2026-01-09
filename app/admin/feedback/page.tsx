'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../../lib/adminClient';

type FeedbackRow = {
  id: number;
  created_at: string | null;
  survey_key: string | null;
  status: string | null;
  user_id: string | null;
  answers: any;
  meta: any;
};

type ListResponse = { rows: FeedbackRow[]; count: number | null; limit: number; offset: number; hasMore: boolean };

function fmt(dt: string | null): string {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [surveyKey, setSurveyKey] = useState('tester_feedback_v1');
  const [status, setStatus] = useState('');
  const [limit, setLimit] = useState<'50' | '200'>('50');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (surveyKey.trim()) p.set('survey_key', surveyKey.trim());
    if (status.trim()) p.set('status', status.trim());
    p.set('limit', limit);
    p.set('offset', String(offset));
    return p.toString();
  }, [q, surveyKey, status, limit, offset]);

  const fetchRows = async (nextOffset = 0) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminFetch<ListResponse>(`/api/admin/feedback?${qs.replace(/offset=\\d+/, `offset=${nextOffset}`)}`);
      setRows(res.rows || []);
      setCount(typeof res.count === 'number' ? res.count : null);
      setOffset(res.offset || 0);
      setHasMore(!!res.hasMore);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = () => fetchRows(0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 className="section-title">📝 Feedback</h2>
        <button onClick={() => fetchRows(offset)} className="action-button" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      <div className="search-container" style={{ marginTop: 12 }}>
        <input
          className="search-input"
          placeholder="Search (name/email)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        <input
          className="search-input"
          placeholder="survey_key"
          value={surveyKey}
          onChange={(e) => setSurveyKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          style={{ maxWidth: 220 }}
        />
        <select className="admin-select" style={{ height: 54, maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="new">new</option>
          <option value="reviewed">reviewed</option>
          <option value="actioned">actioned</option>
        </select>
        <select className="admin-select" style={{ height: 54, maxWidth: 120 }} value={limit} onChange={(e) => setLimit((e.target.value as any) || '50')}>
          <option value="50">50</option>
          <option value="200">200</option>
        </select>
        <button onClick={onSearch} disabled={loading} className="search-button">
          {loading ? '...' : '🔍 Search'}
        </button>
      </div>

      {err ? (
        <div className="stat-card" style={{ marginTop: 12, border: '1px solid rgba(255,0,110,0.6)' }}>
          <div style={{ fontWeight: 900, color: '#FF4FD8' }}>{err}</div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 12, margin: '12px 0 18px 0' }}>
        <button className="action-button" disabled={loading || offset <= 0} onClick={() => fetchRows(Math.max(offset - Number(limit), 0))}>
          ← Prev
        </button>
        <button className="action-button" disabled={loading || !hasMore} onClick={() => fetchRows(offset + Number(limit))}>
          Next →
        </button>
        <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700, alignSelf: 'center' }}>
          showing {rows.length} • offset {offset}
          {typeof count === 'number' ? ` • total ${count}` : ''}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#E2E8F0' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: 12 }}>Time</th>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>Voucher?</th>
              <th style={{ padding: 12 }}>survey_key</th>
              <th style={{ padding: 12 }}>status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const a = (r.answers || {}) as any;
              const name = a.participant_name || '—';
              const email = a.participant_email || '—';
              const voucher = a.claim_voucher === true ? 'Yes' : a.claim_voucher === false ? 'No' : '—';
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 12 }}>{fmt(r.created_at)}</td>
                  <td style={{ padding: 12 }}>{name}</td>
                  <td style={{ padding: 12 }}>{email}</td>
                  <td style={{ padding: 12 }}>{voucher}</td>
                  <td style={{ padding: 12 }}>{r.survey_key || '—'}</td>
                  <td style={{ padding: 12 }}>{r.status || '—'}</td>
                  <td style={{ padding: 12 }}>
                    <div className="admin-actions">
                      <a className="action-button" href={`/admin/feedback/${r.id}`} style={{ padding: '7px 10px', fontSize: 12 }}>
                        View
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td style={{ padding: 12, color: '#94A3B8' }} colSpan={7}>
                  {loading ? 'Loading…' : 'No feedback found.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

