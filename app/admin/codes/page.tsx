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
              <th style={{ padding: 12 }}>Redeemed by</th>
              <th style={{ padding: 12 }}>Redeemed at</th>
              <th style={{ padding: 12 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const red = (r.access_code_redemptions || [])[0] || null;
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
                  <td style={{ padding: 12 }}>{red?.user_email || '—'}</td>
                  <td style={{ padding: 12 }}>{red?.redeemed_at ? new Date(red.redeemed_at).toLocaleString() : '—'}</td>
                  <td style={{ padding: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td style={{ padding: 12, color: '#94A3B8' }} colSpan={8}>
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

