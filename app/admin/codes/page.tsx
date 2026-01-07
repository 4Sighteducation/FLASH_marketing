'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../../lib/adminClient';

type Tier = 'pro' | 'premium';
type CodeItem = { code: string; tier: Tier; expiresAt: string; maxUses: number };

type BulkResponse = {
  ok: boolean;
  count: number;
  tier: Tier;
  expiresAt: string;
  maxUses: number;
  items: CodeItem[];
};

type RedemptionRow = { user_email: string | null; redeemed_at: string | null };
type CodeRow = {
  id: string;
  code: string;
  code_pretty: string;
  tier: Tier;
  expires_at: string | null;
  max_uses: number;
  uses_count: number;
  note: string | null;
  assigned_to?: string | null;
  assigned_note?: string | null;
  assigned_at?: string | null;
  cancelled_at?: string | null;
  cancelled_note?: string | null;
  created_at: string | null;
  access_code_redemptions?: RedemptionRow[] | null;
};

type ListResponse = { rows: CodeRow[]; count: number; limit: number; offset: number };

function toCsv(rows: { code: string; tier: string; expiresAt: string; maxUses: number }[]) {
  const header = ['code', 'tier', 'expiresAt', 'maxUses'];
  const lines = rows.map((r) => [r.code, r.tier, r.expiresAt, String(r.maxUses)].join(','));
  return [header.join(','), ...lines].join('\n');
}

export default function CodesPage() {
  const [count, setCount] = useState('30');
  const [tier, setTier] = useState<Tier>('pro');
  const [maxUses, setMaxUses] = useState('1');
  const [note, setNote] = useState('casual_testers');
  const [expiresDays, setExpiresDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<CodeItem[]>([]);

  const [rows, setRows] = useState<CodeRow[]>([]);
  const [rowsCount, setRowsCount] = useState<number>(0);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [edit, setEdit] = useState<Record<string, { assigned_to: string; assigned_note: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const expiresAtIso = useMemo(() => {
    const days = Math.max(1, Math.min(3650, Number(expiresDays) || 30));
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }, [expiresDays]);

  const generatedText = useMemo(() => generated.map((x) => x.code).join('\n'), [generated]);

  const refresh = async () => {
    setRowsLoading(true);
    try {
      const res = await adminFetch<ListResponse>('/api/admin/codes?limit=200&offset=0');
      setRows(res.rows || []);
      setRowsCount(res.count || 0);
      // Initialize edit cache for visible rows
      setEdit((prev) => {
        const next: Record<string, { assigned_to: string; assigned_note: string }> = { ...prev };
        for (const r of res.rows || []) {
          if (!next[r.id]) {
            next[r.id] = {
              assigned_to: String((r as any).assigned_to || ''),
              assigned_note: String((r as any).assigned_note || ''),
            };
          }
        }
        return next;
      });
    } catch (e: any) {
      alert(e?.message || 'Failed to load codes');
    } finally {
      setRowsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    const n = Math.min(500, Math.max(1, Number(count) || 0));
    if (!n) return alert('Enter a valid count');
    setLoading(true);
    try {
      const res = await adminFetch<BulkResponse>('/api/admin/codes/bulk', {
        method: 'POST',
        body: JSON.stringify({
          count: n,
          tier,
          maxUses: Math.min(50, Math.max(1, Number(maxUses) || 1)),
          note: note.trim() || null,
          expiresAtIso,
        }),
      });
      setGenerated(res.items || []);
      await refresh();
      alert(`Generated ${res.items?.length || 0} codes.`);
    } catch (e: any) {
      alert(e?.message || 'Failed to generate codes');
    } finally {
      setLoading(false);
    }
  };

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      alert('Copied to clipboard.');
    } catch {
      alert('Copy failed. You can manually select + copy from the textarea.');
    }
  };

  const downloadCsv = () => {
    const csv = toCsv(generated.map((x) => ({ code: x.code, tier: x.tier, expiresAt: x.expiresAt, maxUses: x.maxUses })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fl4sh-codes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAssignment = async (row: CodeRow) => {
    const v = edit[row.id] || { assigned_to: '', assigned_note: '' };
    if (!confirm(`Save assignment for ${row.code_pretty}?`)) return;
    setSavingId(row.id);
    try {
      await adminFetch(`/api/admin/codes/${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          assigned_to: v.assigned_to.trim() || null,
          assigned_note: v.assigned_note.trim() || null,
        }),
      });
      await refresh();
    } catch (e: any) {
      alert(e?.message || 'Failed to save assignment (is the DB migration applied?)');
    } finally {
      setSavingId(null);
    }
  };

  const cancelCode = async (row: CodeRow) => {
    const reason = prompt('Cancel reason (optional):') || '';
    if (!confirm(`Cancel code ${row.code_pretty}?\n\nThis will expire it immediately.`)) return;
    setSavingId(row.id);
    try {
      await adminFetch(`/api/admin/codes/${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ cancel: true, cancelled_note: reason.trim() || null }),
      });
      await refresh();
    } catch (e: any) {
      alert(e?.message || 'Failed to cancel code (is the DB migration applied?)');
    } finally {
      setSavingId(null);
    }
  };

  const deleteCode = async (row: CodeRow) => {
    if (!confirm(`DELETE code ${row.code_pretty}?\n\nOnly possible if unused.\nThis cannot be undone.`)) return;
    setDeletingId(row.id);
    try {
      await adminFetch(`/api/admin/codes/${row.id}`, { method: 'DELETE' });
      await refresh();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete code');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <h2 className="section-title">🎟️ Access Codes</h2>
        <button className="action-button" onClick={refresh} disabled={rowsLoading}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#94A3B8', fontSize: 14, fontWeight: 800 }}>Generate</span>
          <input className="search-input" style={{ width: 110 }} value={count} onChange={(e) => setCount(e.target.value)} inputMode="numeric" />
          <span style={{ color: '#94A3B8', fontSize: 14, fontWeight: 700 }}>codes</span>

          <select
            className="search-input"
            style={{ width: 170 }}
            value={tier}
            onChange={(e) => setTier((e.target.value as Tier) || 'pro')}
          >
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>

          <span style={{ color: '#94A3B8', fontSize: 14, fontWeight: 700 }}>max uses</span>
          <input className="search-input" style={{ width: 110 }} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} inputMode="numeric" />

          <span style={{ color: '#94A3B8', fontSize: 14, fontWeight: 700 }}>expires in days</span>
          <input className="search-input" style={{ width: 110 }} value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)} inputMode="numeric" />

          <input className="search-input" style={{ minWidth: 220 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="note (optional)" />

          <button className="action-button" onClick={generate} disabled={loading}>
            {loading ? '...' : '✨ Generate'}
          </button>
        </div>

        {generated.length > 0 ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="action-button" onClick={copyCodes}>
                📋 Copy
              </button>
              <button className="action-button" onClick={downloadCsv}>
                ⬇️ Download CSV
              </button>
              <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700 }}>
                Expires: {new Date(expiresAtIso).toLocaleString()}
              </div>
            </div>
            <textarea
              value={generatedText}
              readOnly
              style={{
                width: '100%',
                minHeight: 140,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(0,0,0,0.25)',
                color: '#E2E8F0',
                padding: 12,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            />
          </div>
        ) : null}
      </div>

      <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 10 }}>
        {rowsCount} total • showing {rows.length}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#E2E8F0' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: 12 }}>Code</th>
              <th style={{ padding: 12 }}>Tier</th>
              <th style={{ padding: 12 }}>Uses</th>
              <th style={{ padding: 12 }}>Expires</th>
              <th style={{ padding: 12 }}>Note</th>
              <th style={{ padding: 12 }}>Assigned</th>
              <th style={{ padding: 12 }}>Assigned note</th>
              <th style={{ padding: 12 }}>Assigned at</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Redeemed by</th>
              <th style={{ padding: 12 }}>Redeemed at</th>
              <th style={{ padding: 12 }}>Created</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const red = (r.access_code_redemptions || [])[0] || null;
              const isRedeemed = !!red?.redeemed_at || (r.uses_count || 0) > 0;
              const isCancelled = !!r.cancelled_at;
              const isAssigned = !!(r.assigned_to && String(r.assigned_to).trim());
              const status = isCancelled ? 'cancelled' : isRedeemed ? 'redeemed' : isAssigned ? 'assigned' : 'unassigned';
              const v = edit[r.id] || { assigned_to: String(r.assigned_to || ''), assigned_note: String(r.assigned_note || '') };
              const changed =
                v.assigned_to.trim() !== String(r.assigned_to || '').trim() || v.assigned_note.trim() !== String(r.assigned_note || '').trim();
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                    {r.code_pretty}
                  </td>
                  <td style={{ padding: 12 }}>{r.tier}</td>
                  <td style={{ padding: 12 }}>
                    {r.uses_count}/{r.max_uses}
                  </td>
                  <td style={{ padding: 12 }}>{r.expires_at ? new Date(r.expires_at).toLocaleString() : '—'}</td>
                  <td style={{ padding: 12 }}>{r.note || '—'}</td>
                  <td style={{ padding: 12 }}>
                    <input
                      className="search-input"
                      style={{ minWidth: 180, padding: 10, fontSize: 14 }}
                      placeholder="Name / who you sent it to"
                      value={v.assigned_to}
                      onChange={(e) => setEdit((m) => ({ ...m, [r.id]: { ...(m[r.id] || v), assigned_to: e.target.value } }))}
                      disabled={rowsLoading || savingId === r.id || deletingId === r.id || isRedeemed || isCancelled}
                    />
                  </td>
                  <td style={{ padding: 12 }}>
                    <input
                      className="search-input"
                      style={{ minWidth: 260, padding: 10, fontSize: 14 }}
                      placeholder="Notes (optional)"
                      value={v.assigned_note}
                      onChange={(e) => setEdit((m) => ({ ...m, [r.id]: { ...(m[r.id] || v), assigned_note: e.target.value } }))}
                      disabled={rowsLoading || savingId === r.id || deletingId === r.id || isRedeemed || isCancelled}
                    />
                  </td>
                  <td style={{ padding: 12 }}>
                    {r.assigned_at ? new Date(r.assigned_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span className={`tier-badge tier-${status === 'redeemed' ? 'pro' : status === 'cancelled' ? 'ultimate' : status === 'assigned' ? 'pro' : 'starter'}`}>
                      {status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>{red?.user_email || '—'}</td>
                  <td style={{ padding: 12 }}>{red?.redeemed_at ? new Date(red.redeemed_at).toLocaleString() : '—'}</td>
                  <td style={{ padding: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                  <td style={{ padding: 12 }}>
                    <div className="admin-actions">
                      <button
                        className="action-button"
                        style={{ padding: '8px 10px' }}
                        disabled={!changed || rowsLoading || savingId === r.id || deletingId === r.id || isRedeemed || isCancelled}
                        onClick={() => saveAssignment(r)}
                        title="Save assignment fields"
                      >
                        💾 Save
                      </button>
                      <button
                        className="action-button"
                        style={{ padding: '8px 10px', opacity: isCancelled ? 0.5 : 1 }}
                        disabled={rowsLoading || savingId === r.id || deletingId === r.id || isRedeemed || isCancelled}
                        onClick={() => cancelCode(r)}
                        title="Expire immediately (keeps row for tracking)"
                      >
                        🚫 Cancel
                      </button>
                      <button
                        className="danger-button"
                        style={{ padding: '8px 10px' }}
                        disabled={rowsLoading || savingId === r.id || deletingId === r.id || isRedeemed}
                        onClick={() => deleteCode(r)}
                        title="Delete (only if unused)"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                    {r.cancelled_at ? (
                      <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 6 }}>
                        Cancelled: {new Date(r.cancelled_at).toLocaleString()}
                        {r.cancelled_note ? ` • ${r.cancelled_note}` : ''}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td style={{ padding: 12, color: '#94A3B8' }} colSpan={12}>
                  {rowsLoading ? 'Loading…' : 'No codes yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

