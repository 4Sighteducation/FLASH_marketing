'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adminFetch } from '../../../lib/adminClient';

type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
  name?: string | null;
  subscription: { tier: string | null; expires_at: string | null; source?: string | null };
  device?: {
    last_seen_at: string | null;
    platform: string | null;
    app_version: string | null;
    build_version: string | null;
    device_model: string | null;
    os_name: string | null;
    os_version: string | null;
    country: string | null;
  } | null;
  activation?: { subjects_count: number; cards_count: number };
  engagement?: { reviews_7d: number; streak_days: number; last_study_date: string | null };
  monetization?: { redemptions_count: number; parent_purchases_count: number };
};
type UsersResponse = { rows: AdminUserRow[]; limit: number; offset: number; hasMore: boolean };

export default function UserManagement() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [pageSize, setPageSize] = useState<'100' | '15'>('100');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedById, setSelectedById] = useState<Record<string, boolean>>({});
  const [busyBulk, setBusyBulk] = useState<string | null>(null);

  // Dual horizontal scrollbars: one above the table, one on the table container.
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const topScrollSpacerRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const headCheckboxRef = useRef<HTMLInputElement | null>(null);

  const selectedIds = useMemo(() => Object.keys(selectedById).filter((id) => !!selectedById[id]), [selectedById]);
  const selectedCount = selectedIds.length;
  const allOnPageSelected = users.length > 0 && users.every((u) => !!selectedById[u.id]);
  const someOnPageSelected = users.some((u) => !!selectedById[u.id]);

  const sendProCode = async (userId: string, email: string | null) => {
    if (!email) {
      alert('This user has no email on their auth account, so we cannot email them a code.');
      return;
    }
    if (!confirm(`Send a FL4SH Pro code to ${email}?`)) return;

    try {
      const res = await adminFetch<{ ok: boolean; email: string; code: string; expires_at: string }>(`/api/admin/users/${userId}/send-pro-code`, {
        method: 'POST',
        body: JSON.stringify({ expires_at: expiresAt ? new Date(expiresAt).toISOString() : null }),
      });
      alert(`Sent!\n\nTo: ${res.email}\nCode: ${res.code}\nExpires: ${new Date(res.expires_at).toLocaleString()}`);
    } catch (e: any) {
      alert('Error: ' + (e?.message || 'Failed to send code'));
    }
  };

  const fetchUsers = async (nextOffset = 0) => {
    setLoading(true);
    try {
      const res = await adminFetch<UsersResponse>(
        `/api/admin/users?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(pageSize)}&offset=${encodeURIComponent(String(nextOffset))}`,
        { method: 'GET' }
      );
      setUsers(res.rows || []);
      setOffset(res.offset || 0);
      setHasMore(!!res.hasMore);
      // Clear selections that are no longer visible (avoid confusing bulk ops)
      setSelectedById((prev) => {
        const next: Record<string, boolean> = {};
        for (const u of res.rows || []) {
          if (prev[u.id]) next[u.id] = true;
        }
        return next;
      });
    } catch (error: any) {
      console.error('Error searching users:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: show users immediately (no search required)
    fetchUsers(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep header checkbox indeterminate state in sync.
  useEffect(() => {
    if (!headCheckboxRef.current) return;
    headCheckboxRef.current.indeterminate = !allOnPageSelected && someOnPageSelected;
  }, [allOnPageSelected, someOnPageSelected]);

  // Keep top scrollbar spacer width in sync with table scrollWidth
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    const spacerEl = topScrollSpacerRef.current;
    if (!tableEl || !spacerEl) return;

    const update = () => {
      spacerEl.style.width = `${tableEl.scrollWidth}px`;
    };
    update();
    const RO = (window as any).ResizeObserver;
    const ro = RO ? new RO(update) : null;
    if (ro) ro.observe(tableEl);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      try {
        ro?.disconnect?.();
      } catch {}
    };
  }, [users, pageSize]);

  // Sync scroll positions (top <-> bottom)
  useEffect(() => {
    const topEl = topScrollRef.current;
    const tableEl = tableScrollRef.current;
    if (!topEl || !tableEl) return;

    let lock = false;
    const onTop = () => {
      if (lock) return;
      lock = true;
      tableEl.scrollLeft = topEl.scrollLeft;
      lock = false;
    };
    const onTable = () => {
      if (lock) return;
      lock = true;
      topEl.scrollLeft = tableEl.scrollLeft;
      lock = false;
    };

    topEl.addEventListener('scroll', onTop);
    tableEl.addEventListener('scroll', onTable);
    return () => {
      topEl.removeEventListener('scroll', onTop);
      tableEl.removeEventListener('scroll', onTable);
    };
  }, []);

  const changeTier = async (userId: string, newTier: string, email: string | null) => {
    if (!confirm(`Change ${email || userId} to ${newTier}?`)) return;

    try {
      await adminFetch(`/api/admin/users/${userId}/tier`, {
        method: 'POST',
        body: JSON.stringify({ tier: newTier, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null }),
      });
      alert('Tier updated!');
      await fetchUsers(offset);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const blockUser = async (userId: string, blocked: boolean, email: string | null) => {
    if (!confirm(`${blocked ? 'BLOCK' : 'UNBLOCK'} ${email || userId}?`)) return;
    try {
      await adminFetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        body: JSON.stringify({ blocked }),
      });
      alert(blocked ? 'User blocked.' : 'User unblocked.');
      await fetchUsers(offset);
    } catch (e: any) {
      alert('Error: ' + (e.message || 'Failed'));
    }
  };

  const hardDeleteUser = async (userId: string, email: string | null) => {
    if (
      !confirm(
        `HARD DELETE ${email || userId}?\n\nThis will attempt to delete:\n• App data rows (best-effort)\n• Auth account\n\nCANNOT BE UNDONE!`
      )
    ) {
      return;
    }

    try {
      const res = await adminFetch<{ ok: boolean; deleteErrors?: Array<{ table: string; error: string }> }>(
        `/api/admin/users/${userId}/hard-delete`,
        { method: 'DELETE' }
      );
      if (res.deleteErrors && res.deleteErrors.length > 0) {
        console.warn('Delete errors:', res.deleteErrors);
        alert(`User deleted, but some table deletes failed (see console).`);
      } else {
        alert('User deleted successfully.');
      }
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const toggleSelectAllOnPage = () => {
    setSelectedById((prev) => {
      const next: Record<string, boolean> = { ...prev };
      const newValue = !allOnPageSelected;
      for (const u of users) next[u.id] = newValue;
      return next;
    });
  };

  const toggleSelectOne = (userId: string) => {
    setSelectedById((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const bulkSendCodes = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`Send Pro codes to ${selectedCount} selected users?\n\nUsers without emails will be skipped.`)) return;
    setBusyBulk('Sending codes…');
    try {
      const results: Array<{ email: string; code: string; expires_at: string } | { error: string; id: string; email?: string | null }> = [];
      for (const id of selectedIds) {
        const u = users.find((x) => x.id === id);
        const email = u?.email ?? null;
        if (!email) {
          results.push({ error: 'No email', id, email });
          continue;
        }
        try {
          const res = await adminFetch<{ ok: boolean; email: string; code: string; expires_at: string }>(`/api/admin/users/${id}/send-pro-code`, {
            method: 'POST',
            body: JSON.stringify({ expires_at: expiresAt ? new Date(expiresAt).toISOString() : null }),
          });
          results.push(res);
        } catch (e: any) {
          results.push({ error: e?.message || 'Failed', id, email });
        }
      }

      const ok = results.filter((r: any) => (r as any).code).length;
      const failed = results.length - ok;
      const lines = results
        .map((r: any) => {
          if (r.code) return `${r.email}\t${r.code}\t${r.expires_at}`;
          return `${r.email || r.id}\tERROR: ${r.error}`;
        })
        .join('\n');
      alert(`Bulk send complete.\n\nSent: ${ok}\nFailed/skipped: ${failed}\n\n(Details copied to clipboard if supported.)`);
      try {
        await navigator.clipboard.writeText(lines);
      } catch {}
    } finally {
      setBusyBulk(null);
    }
  };

  const bulkHardDelete = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`HARD DELETE ${selectedCount} users?\n\nThis cannot be undone.`)) return;
    setBusyBulk('Deleting users…');
    try {
      for (const id of selectedIds) {
        try {
          await adminFetch(`/api/admin/users/${id}/hard-delete`, { method: 'DELETE' });
        } catch {}
      }
      setSelectedById({});
      await fetchUsers(offset);
      alert('Bulk delete finished (some rows may have failed; refresh and spot-check).');
    } finally {
      setBusyBulk(null);
    }
  };

  const bulkBlock = async (blocked: boolean) => {
    if (selectedCount === 0) return;
    if (!confirm(`${blocked ? 'BLOCK' : 'UNBLOCK'} ${selectedCount} users?`)) return;
    setBusyBulk(blocked ? 'Blocking users…' : 'Unblocking users…');
    try {
      for (const id of selectedIds) {
        try {
          await adminFetch(`/api/admin/users/${id}/block`, { method: 'POST', body: JSON.stringify({ blocked }) });
        } catch {}
      }
      await fetchUsers(offset);
    } finally {
      setBusyBulk(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="section-title">👥 Users</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 800 }}>Page size</span>
          <select
            className="search-input"
            style={{ width: 120 }}
            value={pageSize}
            onChange={(e) => setPageSize((e.target.value as any) || '100')}
          >
            <option value="100">100</option>
            <option value="15">15</option>
          </select>
          <button onClick={() => fetchUsers(0)} disabled={loading} className="action-button">
            {loading ? '...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="admin-bulkbar">
          <div style={{ color: '#E2E8F0', fontWeight: 800 }}>
            Selected: {selectedCount} {busyBulk ? `• ${busyBulk}` : ''}
          </div>
          <div className="admin-actions">
            <button className="action-button" onClick={bulkSendCodes} disabled={!!busyBulk}>
              ✉️ Send Pro codes
            </button>
            <button className="action-button" onClick={() => bulkBlock(true)} disabled={!!busyBulk}>
              ⛔ Block
            </button>
            <button className="action-button" onClick={() => bulkBlock(false)} disabled={!!busyBulk}>
              ✅ Unblock
            </button>
            <button className="danger-button" onClick={bulkHardDelete} disabled={!!busyBulk}>
              🗑️ Hard delete
            </button>
            <button className="action-button" onClick={() => setSelectedById({})} disabled={!!busyBulk}>
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <div className="search-container" style={{ marginTop: 12 }}>
        <input
          className="search-input"
          placeholder="Search by email or name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers(0)}
        />
        <button onClick={() => fetchUsers(0)} disabled={loading} className="search-button">
          {loading ? '...' : '🔍 Search'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, margin: '12px 0 18px 0' }}>
        <button className="action-button" disabled={loading || offset <= 0} onClick={() => fetchUsers(Math.max(offset - Number(pageSize), 0))}>
          ← Prev
        </button>
        <button className="action-button" disabled={loading || !hasMore} onClick={() => fetchUsers(offset + Number(pageSize))}>
          Next →
        </button>
        <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700, alignSelf: 'center' }}>
          showing {users.length} • offset {offset}
        </div>
      </div>

      <div style={{ marginBottom: 20, color: '#94A3B8', fontSize: 14 }}>
        Tier overrides are stored in <code style={{ color: '#00F5FF' }}>public.user_subscriptions</code>. Optional expiry is useful for
        temporary grants.
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ color: '#94A3B8', fontSize: 14, display: 'block', marginBottom: 8 }}>
          Optional expiry (applies to tier changes):
        </label>
        <input
          className="search-input"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Top horizontal scrollbar (synced) so you don't need to scroll to the bottom first */}
      <div ref={topScrollRef} className="admin-topscroll" aria-hidden="true">
        <div ref={topScrollSpacerRef} style={{ height: 1 }} />
      </div>

      <div ref={tableScrollRef} className="admin-tablewrap">
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#E2E8F0' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: 12, position: 'sticky', top: 0, background: 'rgba(10, 15, 30, 0.98)', zIndex: 3 }}>
                <input ref={headCheckboxRef} type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAllOnPage} />
              </th>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>Tier</th>
              <th style={{ padding: 12 }}>Subjects</th>
              <th style={{ padding: 12 }}>Cards</th>
              <th style={{ padding: 12 }}>Last active</th>
              <th style={{ padding: 12 }}>Reviews 7d</th>
              <th style={{ padding: 12 }}>Streak</th>
              <th style={{ padding: 12 }}>Device</th>
              <th style={{ padding: 12 }}>Country</th>
              <th style={{ padding: 12 }}>Redeems</th>
              <th style={{ padding: 12 }}>Parent buys</th>
              <th style={{ padding: 12 }}>Joined</th>
              <th style={{ padding: 12, minWidth: 320 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const tier = (u.subscription?.tier || 'free').toLowerCase();
              const src = u.subscription?.source ? ` (${u.subscription.source})` : '';
              const lastActive = u.device?.last_seen_at || u.last_sign_in_at || null;
              const deviceLabel = u.device?.device_model || u.device?.platform || '—';
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 12 }}>
                    <input type="checkbox" checked={!!selectedById[u.id]} onChange={() => toggleSelectOne(u.id)} />
                  </td>
                  <td style={{ padding: 12 }}>{u.email || '(no email)'}</td>
                  <td style={{ padding: 12 }}>{u.name || '—'}</td>
                  <td style={{ padding: 12 }}>
                    <span className={`tier-badge tier-${tier}`}>{tier}</span>
                    <span style={{ color: '#64748B', fontSize: 11 }}>{src}</span>
                  </td>
                  <td style={{ padding: 12 }}>{u.activation?.subjects_count ?? 0}</td>
                  <td style={{ padding: 12 }}>{u.activation?.cards_count ?? 0}</td>
                  <td style={{ padding: 12 }}>{lastActive ? new Date(lastActive).toLocaleString() : '—'}</td>
                  <td style={{ padding: 12 }}>{u.engagement?.reviews_7d ?? 0}</td>
                  <td style={{ padding: 12 }}>{u.engagement?.streak_days ?? 0}</td>
                  <td style={{ padding: 12 }}>{deviceLabel}</td>
                  <td style={{ padding: 12 }}>{u.device?.country || '—'}</td>
                  <td style={{ padding: 12 }}>{u.monetization?.redemptions_count ?? 0}</td>
                  <td style={{ padding: 12 }}>{u.monetization?.parent_purchases_count ?? 0}</td>
                  <td style={{ padding: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: 12 }}>
                    <div className="admin-actions">
                      <a className="action-button" href={`/admin/users/${u.id}`} style={{ padding: '7px 10px', fontSize: 12 }}>
                        View
                      </a>

                      <select
                        className="admin-select"
                        value={tier}
                        onChange={(e) => changeTier(u.id, e.target.value, u.email)}
                        style={{ padding: '8px 10px', fontSize: 12 }}
                        title="Sets tier in public.user_subscriptions (real, persisted)"
                      >
                        <option value="free">free</option>
                        <option value="premium">premium</option>
                        <option value="pro">pro</option>
                      </select>

                      <button className="action-button" onClick={() => sendProCode(u.id, u.email)} style={{ padding: '7px 10px', fontSize: 12 }} title="Send code">
                        ✉️
                      </button>
                      <button
                        className="action-button"
                        onClick={() => blockUser(u.id, !u.banned_until, u.email)}
                        style={{ padding: '7px 10px', fontSize: 12, opacity: u.banned_until ? 0.9 : 0.7 }}
                        title={u.banned_until ? 'Unblock user' : 'Block user'}
                      >
                        {u.banned_until ? '✅' : '⛔'}
                      </button>
                      <button className="danger-button" onClick={() => hardDeleteUser(u.id, u.email)} style={{ padding: '7px 10px', fontSize: 12 }} title="Hard delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td style={{ padding: 12, color: '#94A3B8' }} colSpan={13}>
                  {loading ? 'Loading…' : 'No users.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

