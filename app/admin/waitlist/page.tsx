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
  const [launchSubject, setLaunchSubject] = useState('Your FL4SH early access is ready ⚡');
  const [previewTo, setPreviewTo] = useState('');
  const [sendLimit, setSendLimit] = useState('100');
  const [dryRun, setDryRun] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

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

  const grantProNow = async (rowId: string) => {
    if (!confirm('Grant Pro to this user NOW (requires they already created an account with the same email)?')) return;
    try {
      const res = await adminFetch<{ success: boolean; expiresAt?: string; error?: string }>(
        `/api/admin/waitlist/${rowId}/grant-pro-now`,
        { method: 'POST', body: JSON.stringify({}) }
      );
      if (!res?.success) throw new Error(res?.error || 'Grant failed');
      await fetchRows(offset);
      alert('Granted Pro (server-side). Ask the user to fully sign out and sign back in.');
    } catch (e: any) {
      alert(e?.message || 'Failed to grant Pro');
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

  const sendLaunchEmail = async (mode: 'preview' | 'batch') => {
    if (sending) return;

    if (mode === 'preview') {
      const email = previewTo.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        alert('Enter a valid preview email address');
        return;
      }
    } else {
      if (!confirm(`Send launch email to up to ${Number(sendLimit) || 100} WAITLIST users where Notified = No?`)) return;
    }

    setSending(true);
    setSendResult(null);
    try {
      const res = await adminFetch<any>('/api/admin/waitlist/send-launch-email', {
        method: 'POST',
        body: JSON.stringify({
          mode,
          preview_to: previewTo.trim(),
          subject: launchSubject.trim(),
          limit: Number(sendLimit) || 100,
          dry_run: dryRun === true,
        }),
      });
      setSendResult(res);
      if (mode === 'batch' && !dryRun) {
        await fetchRows(0);
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to send');
    } finally {
      setSending(false);
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

      <div className="stat-card" style={{ textAlign: 'left', marginBottom: 16 }}>
        <div style={{ fontWeight: 900, color: '#E2E8F0', fontSize: 16, marginBottom: 10 }}>🚀 Launch email</div>
        <div style={{ color: '#94A3B8', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
          Uses SendGrid template <code style={{ color: '#E2E8F0' }}>SENDGRID_WAITLIST_TEMPLATE</code> and attaches “What to Test”.
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="search-input"
            style={{ maxWidth: 420 }}
            placeholder="Subject"
            value={launchSubject}
            onChange={(e) => setLaunchSubject(e.target.value)}
          />
          <input
            className="search-input"
            style={{ maxWidth: 280 }}
            placeholder="Preview to (email)"
            value={previewTo}
            onChange={(e) => setPreviewTo(e.target.value)}
          />
          <input
            className="search-input"
            style={{ maxWidth: 140 }}
            placeholder="Max recipients"
            value={sendLimit}
            onChange={(e) => setSendLimit(e.target.value)}
            inputMode="numeric"
          />
          <div style={{ color: '#94A3B8', fontWeight: 800, fontSize: 12 }}>
            Sends only to waitlist users where <b>Notified = No</b>.
          </div>
          <label style={{ color: '#94A3B8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry run
          </label>
          <button className="action-button" disabled={sending} onClick={() => sendLaunchEmail('preview')}>
            {sending ? '…' : 'Send preview'}
          </button>
          <button className="action-button" disabled={sending} onClick={() => sendLaunchEmail('batch')}>
            {sending ? '…' : 'Send batch'}
          </button>
        </div>

        {sendResult ? (
          <div style={{ marginTop: 12, color: '#E2E8F0', fontWeight: 800, fontSize: 13 }}>
            <div style={{ color: '#94A3B8', marginBottom: 6 }}>
              Result: mode={String(sendResult.mode)} • dryRun={String(sendResult.dryRun)}
              {typeof sendResult.sent === 'number' ? ` • sent=${sendResult.sent}` : ''}
              {typeof sendResult.failed === 'number' ? ` • failed=${sendResult.failed}` : ''}
              {typeof sendResult.attempted === 'number' ? ` • attempted=${sendResult.attempted}` : ''}
            </div>
            {Array.isArray(sendResult.results) ? (
              <details>
                <summary style={{ cursor: 'pointer' }}>Details</summary>
                <pre style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(sendResult.results.slice(0, 50), null, 2)}
                </pre>
                {sendResult.results.length > 50 ? <div style={{ color: '#94A3B8' }}>Showing first 50 results…</div> : null}
              </details>
            ) : null}
          </div>
        ) : null}
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
                      <button
                        className="action-button"
                        onClick={() => grantProNow(String(r.id))}
                        style={{ padding: '8px 10px', opacity: r.auto_pro_granted_at ? 0.6 : 1 }}
                        disabled={Boolean(r.auto_pro_granted_at)}
                        title={r.auto_pro_granted_at ? 'Already granted' : 'Grant Pro now for an existing account'}
                      >
                        ⚡ Grant Pro now
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


