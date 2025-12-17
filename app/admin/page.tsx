'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/adminClient';

type WaitlistResponse = { count: number };
type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
  subscription: { tier: string | null; expires_at: string | null };
};
type UsersResponse = { rows: AdminUserRow[] };

export default function AdminDashboard() {
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const waitlist = await adminFetch<WaitlistResponse>('/api/admin/waitlist?limit=1&offset=0');
      setWaitlistCount(waitlist.count ?? 0);

      // Recent users (limited; search-less list is bounded inside API)
      const users = await adminFetch<UsersResponse>('/api/admin/users?limit=10');
      setRecentUsers(users.rows || []);
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
          <div className="stat-number">{waitlistCount ?? '—'}</div>
          <div className="stat-label">Waitlist Signups</div>
        </div>

        <div className="stat-card stat-card-pink">
          <div className="stat-number">{recentUsers.length}</div>
          <div className="stat-label">Recent Users (shown)</div>
        </div>
      </div>

      <h3 className="section-title" style={{ marginTop: '48px' }}>👥 Recent Users</h3>
      <div style={{ display: 'grid', gap: '12px' }}>
        {recentUsers.map((u) => (
          <div key={u.id} className="user-card">
            <div className="user-header" style={{ cursor: 'default' }}>
              <div>
                <div className="user-email">{u.email || '(no email)'}</div>
                <div style={{ marginTop: '8px' }}>
                  <span className="tier-badge tier-pro" style={{ opacity: 0.7 }}>
                    {u.subscription?.tier || '—'}
                  </span>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>
                    Created {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
              <span style={{ color: '#94A3B8', fontSize: '12px' }}>
                {u.banned_until ? 'BLOCKED' : 'OK'}
              </span>
            </div>
          </div>
        ))}
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

