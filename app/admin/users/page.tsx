'use client';

import { useState } from 'react';
import { adminFetch } from '../../../lib/adminClient';

type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
  subscription: { tier: string | null; expires_at: string | null };
};
type UsersResponse = { rows: AdminUserRow[] };

export default function UserManagement() {
  const [searchEmail, setSearchEmail] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');

  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      alert('Please enter an email to search');
      return;
    }

    setLoading(true);
    try {
      const res = await adminFetch<UsersResponse>(`/api/admin/users?q=${encodeURIComponent(searchEmail)}&limit=25`, {
        method: 'GET',
      });
      setUsers(res.rows || []);
      if (!res.rows || res.rows.length === 0) {
        alert('No users found');
      }
    } catch (error: any) {
      console.error('Error searching users:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const changeTier = async (userId: string, newTier: string, email: string | null) => {
    if (!confirm(`Change ${email || userId} to ${newTier}?`)) return;

    try {
      await adminFetch(`/api/admin/users/${userId}/tier`, {
        method: 'POST',
        body: JSON.stringify({ tier: newTier, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null }),
      });
      alert('Tier updated!');
      await searchUsers();
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
      await searchUsers();
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
      setExpandedUser(null);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div>
      <h2 className="section-title">👥 User Management</h2>

      {/* Search */}
      <div className="search-container">
        <input
          type="email"
          className="search-input"
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
        />
        <button 
          onClick={searchUsers} 
          disabled={loading}
          className="search-button"
        >
          {loading ? '...' : '🔍 Search'}
        </button>
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

      {/* Results */}
      {users.length > 0 && (
        <div>
          <p style={{ color: '#94A3B8', marginBottom: '20px', fontSize: '14px' }}>
            {users.length} user{users.length !== 1 ? 's' : ''} found
          </p>

          {users.map((user) => (
            <div key={user.id} className="user-card">
              <div 
                className="user-header"
                onClick={() => setExpandedUser(
                  expandedUser === user.id ? null : user.id
                )}
              >
                <div>
                  <div className="user-email">{user.email || '(no email)'}</div>
                  <div style={{ marginTop: '8px' }}>
                    <span className="tier-badge tier-pro" style={{ opacity: 0.8 }}>
                      {user.subscription?.tier || '—'}
                    </span>
                    <span style={{ color: '#64748B', fontSize: '12px' }}>
                      Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
                <span style={{ color: '#94A3B8' }}>
                  {expandedUser === user.id ? '▲' : '▼'}
                </span>
              </div>

              {expandedUser === user.id && (
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Tier Buttons */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '12px' }}>
                      Change Tier:
                    </p>
                    <div className="flex gap-12">
                      {['free', 'premium', 'pro'].map((tier) => (
                        <button
                          key={tier}
                          onClick={() => changeTier(user.id, tier, user.email)}
                          className="action-button"
                          style={{
                            opacity: (user.subscription?.tier || '').toLowerCase() === tier ? 1 : 0.5,
                            borderColor: (user.subscription?.tier || '').toLowerCase() === tier ? '#00F5FF' : 'rgba(255,255,255,0.1)',
                          }}
                        >
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other Actions */}
                  <div className="flex gap-12" style={{ marginBottom: '16px' }}>
                    <button
                      onClick={() => blockUser(user.id, !user.banned_until, user.email)}
                      className="action-button"
                    >
                      {user.banned_until ? '✅ Unblock' : '⛔ Block'}
                    </button>
                    <button
                      onClick={() => hardDeleteUser(user.id, user.email)}
                      className="danger-button"
                    >
                      🗑️ Hard Delete
                    </button>
                  </div>

                  {/* User Stats */}
                  <div style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '8px', 
                    padding: '12px',
                    fontSize: '13px',
                    color: '#94A3B8',
                  }}>
                    <div>🆔 {user.id}</div>
                    <div>📅 Last sign-in: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</div>
                    <div>⛔ Banned until: {user.banned_until ? new Date(user.banned_until).toLocaleString() : '—'}</div>
                    <div>
                      💎 Tier expiry: {user.subscription?.expires_at ? new Date(user.subscription.expires_at).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {users.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          color: '#64748B', 
          padding: '60px 20px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '16px',
          border: '1px dashed rgba(255,255,255,0.1)',
        }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
          <p>Search for users by email to get started</p>
        </div>
      )}
    </div>
  );
}

