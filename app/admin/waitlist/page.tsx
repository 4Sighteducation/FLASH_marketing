'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../../lib/adminClient';

type WaitlistRow = Record<string, any>;
type WaitlistResponse = { rows: WaitlistRow[]; count: number; limit: number; offset: number };

export default function WaitlistPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchRows = async (nextOffset = 0) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        q,
        limit: String(limit),
        offset: String(nextOffset),
      });
      const res = await adminFetch<WaitlistResponse>(`/api/admin/waitlist?${qs.toString()}`, { method: 'GET' });
      setRows(res.rows || []);
      setCount(res.count || 0);
      setOffset(res.offset || 0);
    } catch (e: any) {
      alert(e.message || 'Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPrev = offset > 0;
  const canNext = offset + limit < count;

  return (
    <div>
      <h2 className="section-title">📧 Waitlist</h2>

      <div className="search-container">
        <input
          className="search-input"
          placeholder="Search by email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchRows(0)}
        />
        <button className="search-button" onClick={() => fetchRows(0)} disabled={loading}>
          {loading ? '...' : '🔍 Search'}
        </button>
      </div>

      <div style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>
        {count} total • showing {rows.length} • offset {offset}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button className="action-button" disabled={loading || !canPrev} onClick={() => fetchRows(Math.max(offset - limit, 0))}>
          ← Prev
        </button>
        <button className="action-button" disabled={loading || !canNext} onClick={() => fetchRows(offset + limit)}>
          Next →
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#E2E8F0' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>Position</th>
              <th style={{ padding: 12 }}>Top 20</th>
              <th style={{ padding: 12 }}>Source</th>
              <th style={{ padding: 12 }}>Notified</th>
              <th style={{ padding: 12 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={(r.id as string) || `${r.email}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: 12 }}>{r.email || '—'}</td>
                <td style={{ padding: 12 }}>{r.position ?? '—'}</td>
                <td style={{ padding: 12 }}>{r.is_top_twenty ? 'Yes' : 'No'}</td>
                <td style={{ padding: 12 }}>{r.source || '—'}</td>
                <td style={{ padding: 12 }}>{r.notified ? 'Yes' : 'No'}</td>
                <td style={{ padding: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td style={{ padding: 12, color: '#94A3B8' }} colSpan={6}>
                  No rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}






