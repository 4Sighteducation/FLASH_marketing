'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../../../lib/adminClient';

type DetailResponse = {
  ok: boolean;
  auth: any | null;
  profile: any | null;
  subscription: { tier: string | null; expires_at: string | null; source: string | null; beta_note?: string | null };
  device: any | null;
  activation: { subjects_count: number; cards_count: number };
  engagement_last_30d: Array<{
    study_date: string;
    reviews_total: number;
    accuracy: number;
    xp_awarded_total: number;
  }>;
  monetization: { redemptions_count: number; parent_purchases_count: number };
};

export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const userId = String(params.userId || '');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminFetch<DetailResponse>(`/api/admin/users/${encodeURIComponent(userId)}/detail`);
        setData(res);
      } catch (e: any) {
        setError(e?.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  const totals = useMemo(() => {
    const rows = data?.engagement_last_30d || [];
    const reviews = rows.reduce((sum, r) => sum + (Number(r.reviews_total) || 0), 0);
    const xp = rows.reduce((sum, r) => sum + (Number(r.xp_awarded_total) || 0), 0);
    return { reviews, xp };
  }, [data]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div><p>Loading user…</p></div>;
  if (error) return <div style={{ color: '#FF006E' }}>Error: {error}</div>;
  if (!data) return <div style={{ color: '#94A3B8' }}>No data.</div>;

  const email = data.auth?.email || data.profile?.email || '(no email)';
  const tier = (data.subscription?.tier || 'free').toLowerCase();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="section-title">👤 User</h2>
        <div className="admin-actions">
          <a className="action-button" href="/admin/users">← Back to Users</a>
          <a className="action-button" href="/admin">Dashboard</a>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 18, marginTop: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#E2E8F0' }}>{email}</div>
        <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`tier-badge tier-${tier}`}>{tier}</span>
          <span style={{ color: '#94A3B8', fontSize: 13 }}>
            source: {data.subscription?.source || '—'}
            {data.subscription?.expires_at ? ` • expires ${new Date(data.subscription.expires_at).toLocaleString()}` : ''}
          </span>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 18 }}>
        <div className="stat-card stat-card-cyan">
          <div className="stat-number">{data.activation?.subjects_count ?? 0}</div>
          <div className="stat-label">Subjects</div>
        </div>
        <div className="stat-card stat-card-pink">
          <div className="stat-number">{data.activation?.cards_count ?? 0}</div>
          <div className="stat-label">Cards</div>
        </div>
        <div className="stat-card stat-card-cyan">
          <div className="stat-number">{data.monetization?.redemptions_count ?? 0}</div>
          <div className="stat-label">Redeems</div>
        </div>
        <div className="stat-card stat-card-pink">
          <div className="stat-number">{data.monetization?.parent_purchases_count ?? 0}</div>
          <div className="stat-label">Parent buys</div>
        </div>
        <div className="stat-card stat-card-cyan">
          <div className="stat-number">{totals.reviews}</div>
          <div className="stat-label">Reviews (30d)</div>
        </div>
        <div className="stat-card stat-card-pink">
          <div className="stat-number">{totals.xp}</div>
          <div className="stat-label">XP (30d)</div>
        </div>
      </div>

      <h3 className="section-title" style={{ marginTop: 22 }}>📈 Engagement (last 30 days)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#E2E8F0' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Reviews</th>
              <th style={{ padding: 12 }}>Accuracy</th>
              <th style={{ padding: 12 }}>XP</th>
            </tr>
          </thead>
          <tbody>
            {(data.engagement_last_30d || []).map((r, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: 12 }}>{r.study_date}</td>
                <td style={{ padding: 12 }}>{r.reviews_total}</td>
                <td style={{ padding: 12 }}>{typeof r.accuracy === 'number' ? `${Math.round(r.accuracy * 100)}%` : '—'}</td>
                <td style={{ padding: 12 }}>{r.xp_awarded_total}</td>
              </tr>
            ))}
            {(data.engagement_last_30d || []).length === 0 ? (
              <tr>
                <td style={{ padding: 12, color: '#94A3B8' }} colSpan={4}>
                  No study activity yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

