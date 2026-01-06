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
  const [autoProDays, setAutoProDays] = useState('365');
  const TOP_N = 50;
  const [newTesterEmail, setNewTesterEmail] = useState('');
  const [newTesterNote, setNewTesterNote] = useState('');

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

  const toggleAutoPro = async (rowId: string, enabled: boolean) => {
    try {
      await adminFetch(`/api/admin/waitlist/${rowId}/auto-pro`, {
        method: 'POST',
        body: JSON.stringify({ enabled, days: Number(autoProDays) || 365 }),
      });
      await fetchRows(offset);
    } catch (e: any) {
      alert(e?.message || 'Failed to update auto-Pro');
    }
  };

  const enableTopN = async (enabled: boolean) => {
    if (!confirm(`${enabled ? 'Enable' : 'Disable'} auto Pro for ALL top-${TOP_N} waitlist entries?`)) return;
    try {
      await adminFetch(`/api/admin/waitlist/auto-pro-top-n`, {
        method: 'POST',
        body: JSON.stringify({ enabled, days: Number(autoProDays) || 365, topN: TOP_N }),
      });
      await fetchRows(0);
    } catch (e: any) {
      alert(e?.message || `Failed to update top-${TOP_N} auto-Pro`);
    }
  };

  const addTester = async () => {
    const email = newTesterEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      alert('Enter a valid email');
      return;
    }
    try {
      await adminFetch(`/api/admin/waitlist/add`, {
        method: 'POST',
        body: JSON.stringify({ email, days: Number(autoProDays) || 365, note: newTesterNote.trim() }),
      });
      setNewTesterEmail('');
      setNewTesterNote('');
      await fetchRows(0);
      alert('Added tester (auto Pro enabled).');
    } catch (e: any) {
      alert(e?.message || 'Failed to add tester');
    }
  };

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

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ color: '#94A3B8', fontSize: 14, fontWeight: 700 }}>Add tester (bypass public cap):</span>
        <input
          className="search-input"
          style={{ maxWidth: 280 }}
          placeholder="email@example.com"
          value={newTesterEmail}
          onChange={(e) => setNewTesterEmail(e.target.value)}
        />
        <input
          className="search-input"
          style={{ maxWidth: 260 }}
          placeholder="note (optional)"
          value={newTesterNote}
          onChange={(e) => setNewTesterNote(e.target.value)}
        />
        <button className="action-button" onClick={addTester}>
          ➕ Add tester (auto Pro)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ color: '#94A3B8', fontSize: 14, fontWeight: 700 }}>Auto-Pro duration (days):</span>
        <input
          className="search-input"
          style={{ maxWidth: 140 }}
          value={autoProDays}
          onChange={(e) => setAutoProDays(e.target.value)}
          inputMode="numeric"
        />
        <button className="action-button" onClick={() => enableTopN(true)}>
          ✅ Enable auto Pro for Top {TOP_N}
        </button>
        <button className="action-button" onClick={() => enableTopN(false)} style={{ opacity: 0.8 }}>
          ⛔ Disable auto Pro for Top {TOP_N}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ color: '#94A3B8', fontSize: 14, fontWeight: 700 }}>Add tester (auto-Pro):</span>
        <input
          className="search-input"
          style={{ minWidth: 260 }}
          placeholder="email@example.com"
          value={addEmail}
          onChange={(e) => setAddEmail(e.target.value)}
        />
        <input
          className="search-input"
          style={{ minWidth: 220 }}
          placeholder="note (optional)"
          value={addNote}
          onChange={(e) => setAddNote(e.target.value)}
        />
        <button className="action-button" onClick={addTester} disabled={loading}>
          ➕ Add tester
        </button>
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
              <th style={{ padding: 12 }}>Top {TOP_N}</th>
              <th style={{ padding: 12 }}>Auto Pro</th>
              <th style={{ padding: 12 }}>Granted</th>
              <th style={{ padding: 12 }}>Source</th>
              <th style={{ padding: 12 }}>Notified</th>
              <th style={{ padding: 12 }}>Created</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={(r.id as string) || `${r.email}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: 12 }}>{r.email || '—'}</td>
                <td style={{ padding: 12 }}>{r.position ?? '—'}</td>
                <td style={{ padding: 12 }}>{r.is_top_twenty ? 'Yes' : 'No'}</td>
                <td style={{ padding: 12 }}>{r.auto_pro_enabled ? `Yes (${r.auto_pro_days || 365}d)` : 'No'}</td>
                <td style={{ padding: 12 }}>{r.auto_pro_granted_at ? new Date(r.auto_pro_granted_at).toLocaleString() : '—'}</td>
                <td style={{ padding: 12 }}>{r.source || '—'}</td>
                <td style={{ padding: 12 }}>{r.notified ? 'Yes' : 'No'}</td>
                <td style={{ padding: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                <td style={{ padding: 12 }}>
                  {r.id ? (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        className="action-button"
                        onClick={() => toggleAutoPro(String(r.id), !r.auto_pro_enabled)}
                        style={{ padding: '8px 10px' }}
                      >
                        {r.auto_pro_enabled ? 'Disable auto Pro' : 'Enable auto Pro'}
                      </button>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td style={{ padding: 12, color: '#94A3B8' }} colSpan={9}>
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


