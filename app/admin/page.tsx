'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/adminClient';

type WaitlistResponse = { count: number };
type DashboardStats = {
  ok: boolean;
  usersCount: number;
  waitlistCount: number;
  active7dCount: number;
  proCount: number;
  premiumCount: number;
  redeemsCount: number;
  parentBuysCount: number;
};

type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  name?: string | null;
  subscription: { tier: string | null; expires_at: string | null; source?: string | null };
  device?: { last_seen_at: string | null; device_model: string | null; platform: string | null; country: string | null } | null;
  activation?: { subjects_count: number; cards_count: number };
  engagement?: { reviews_7d: number; streak_days: number; last_study_date: string | null };
  monetization?: { redemptions_count: number; parent_purchases_count: number };
};
type UsersResponse = { rows: AdminUserRow[]; limit: number; offset: number; hasMore: boolean };

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [pageSize, setPageSize] = useState<'15' | '100'>('15');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchUsers = async (nextOffset = 0) => {
    const res = await adminFetch<UsersResponse>(
      `/api/admin/users?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(pageSize)}&offset=${encodeURIComponent(String(nextOffset))}`,
      { method: 'GET' }
    );
    setUsers(res.rows || []);
    setOffset(res.offset || 0);
    setHasMore(!!res.hasMore);
  };

  const fetchData = async () => {
    try {
      const dash = await adminFetch<DashboardStats>('/api/admin/dashboard');
      setStats(dash);

      // Users preview table (search + pagination)
      await fetchUsers(0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading"><div className="spinner"></div><p>Loading stats...</p></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="section-title">📊 Dashboard Overview</h2>
        <button onClick={fetchData} className="action-button">
          🔄 Refresh
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card stat-card-cyan">
          <div className="stat-number">{stats?.usersCount ?? '—'}</div>
          <div className="stat-label">Total Users</div>
        </div>

        <div className="stat-card stat-card-pink">
          <div className="stat-number">{stats?.active7dCount ?? '—'}</div>
          <div className="stat-label">Active (7d)</div>
        </div>

        <div className="stat-card stat-card-cyan">
          <div className="stat-number">{stats?.proCount ?? '—'}</div>
          <div className="stat-label">Pro (count)</div>
        </div>

        <div className="stat-card stat-card-pink">
          <div className="stat-number">{stats?.redeemsCount ?? '—'}</div>
          <div className="stat-label">Code Redeems</div>
        </div>

        <div className="stat-card stat-card-cyan">
          <div className="stat-number">{stats?.parentBuysCount ?? '—'}</div>
          <div className="stat-label">Parent Purchases</div>
        </div>

        <div className="stat-card stat-card-pink">
          <div className="stat-number">{stats?.waitlistCount ?? '—'}</div>
          <div className="stat-label">Waitlist Signups</div>
        </div>
      </div>

      <h3 className="section-title" style={{ marginTop: '48px' }}>👥 Users</h3>

      <div className="search-container" style={{ marginTop: 12 }}>
        <input
          className="search-input"
          placeholder="Search by email or name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers(0)}
        />
        <select className="admin-select" style={{ height: 54 }} value={pageSize} onChange={(e) => setPageSize((e.target.value as any) || '15')}>
          <option value="15">15</option>
          <option value="100">100</option>
        </select>
        <button onClick={() => fetchUsers(0)} disabled={loading} className="search-button">
          {loading ? '...' : '🔍 Search'}
        </button>
        <a href="/admin/users" className="action-button">
          Open Users →
        </a>
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

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#E2E8F0' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>Tier</th>
              <th style={{ padding: 12 }}>Cards</th>
              <th style={{ padding: 12 }}>Last active</th>
              <th style={{ padding: 12 }}>Reviews 7d</th>
              <th style={{ padding: 12 }}>Streak</th>
              <th style={{ padding: 12 }}>Country</th>
              <th style={{ padding: 12 }}>Redeems</th>
              <th style={{ padding: 12 }}>Parent buys</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const tier = (u.subscription?.tier || 'free').toLowerCase();
              const lastActive = u.device?.last_seen_at || u.last_sign_in_at || null;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 12 }}>{u.email || '(no email)'}</td>
                  <td style={{ padding: 12 }}>
                    <span className={`tier-badge tier-${tier}`}>{tier}</span>
                  </td>
                  <td style={{ padding: 12 }}>{u.activation?.cards_count ?? 0}</td>
                  <td style={{ padding: 12 }}>{lastActive ? new Date(lastActive).toLocaleString() : '—'}</td>
                  <td style={{ padding: 12 }}>{u.engagement?.reviews_7d ?? 0}</td>
                  <td style={{ padding: 12 }}>{u.engagement?.streak_days ?? 0}</td>
                  <td style={{ padding: 12 }}>{u.device?.country || '—'}</td>
                  <td style={{ padding: 12 }}>{u.monetization?.redemptions_count ?? 0}</td>
                  <td style={{ padding: 12 }}>{u.monetization?.parent_purchases_count ?? 0}</td>
                  <td style={{ padding: 12 }}>
                    <div className="admin-actions">
                      <a className="action-button" href={`/admin/users/${u.id}`} style={{ padding: '7px 10px', fontSize: 12 }}>
                        View
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td style={{ padding: 12, color: '#94A3B8' }} colSpan={10}>
                  {loading ? 'Loading…' : 'No users.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <h3 className="section-title" style={{ marginTop: '48px' }}>⚡ Quick Actions</h3>
      <div style={{ display: 'flex', gap: '12px' }}>
        <a href="/admin/users" className="action-button">
          👥 Manage Users
        </a>
        <a href="/admin/waitlist" className="action-button">
          📧 View Waitlist
        </a>
        <a href="/admin/test-tools" className="action-button">
          🧰 Ops Tools
        </a>
        <a 
          href="https://qkapwhyxcpgzahuemucg.supabase.co/project/default/editor" 
          target="_blank" 
          rel="noopener noreferrer"
          className="action-button"
        >
          💻 Supabase Dashboard →
        </a>
      </div>
    </div>
  );
}

