'use client';

import { useState } from 'react';
import { adminFetch } from '../../../lib/adminClient';

export default function TestTools() {
  const [loading, setLoading] = useState(false);
  const [testPassword, setTestPassword] = useState('Test123!ChangeMe');
  const [result, setResult] = useState<string>('');
  const [pushDebugEmail, setPushDebugEmail] = useState('');

  const createTieredTestAccounts = async () => {
    if (!confirm('Create/ensure the 4 tiered test accounts and grant tiers?')) return;
    setLoading(true);
    setResult('');
    try {
      const res = await adminFetch<{ ok: boolean; accounts: any[] }>('/api/admin/test-accounts', {
        method: 'POST',
        body: JSON.stringify({ password: testPassword }),
      });
      setResult(JSON.stringify(res.accounts, null, 2));
      alert('✅ Test accounts created/updated (see result box).');
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const runDueCardsPushNow = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await adminFetch<any>('/api/admin/push/due-cards', {
        method: 'POST',
        body: JSON.stringify({ user_email: pushDebugEmail.trim() || null }),
      });
      setResult(JSON.stringify(res, null, 2));
      alert('✅ Push job invoked (see result).');
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="section-title">🧰 Ops Tools</h2>

      {/* Warning */}
      <div style={{
        background: 'rgba(255, 0, 110, 0.1)',
        border: '1px solid rgba(255, 0, 110, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '32px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <p style={{ color: '#FF006E', fontWeight: 600, margin: 0 }}>
          These tools modify production data. Use carefully!
        </p>
      </div>

      {/* Create tiered test accounts */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h3 style={{ color: '#E2E8F0', fontSize: '20px', marginBottom: '12px' }}>
          🧪 Create/Ensure Tiered Test Accounts
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>
          Creates (or updates) these accounts and grants tiers in <code style={{ color: '#00F5FF' }}>public.user_subscriptions</code>:
          <br />
          <code style={{ color: '#00F5FF' }}>appletester@fl4sh.cards</code> (Pro),
          <code style={{ color: '#00F5FF', marginLeft: 8 }}>stu1@fl4sh.cards</code> (Free),
          <code style={{ color: '#00F5FF', marginLeft: 8 }}>stu2@fl4sh.cards</code> (Premium),
          <code style={{ color: '#00F5FF', marginLeft: 8 }}>stu3@fl4sh.cards</code> (Pro)
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#94A3B8', fontSize: 14, display: 'block', marginBottom: 8 }}>
            Password to set/reset (for all 4 accounts)
          </label>
          <input
            className="search-input"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            placeholder="Minimum 8 chars"
            style={{ maxWidth: 420 }}
          />
        </div>

        <button onClick={createTieredTestAccounts} disabled={loading} className="action-button">
          ⚡ Create / Update 4 Test Accounts
        </button>

        {result && (
          <pre
            style={{
              marginTop: 16,
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 12,
              borderRadius: 8,
              color: '#E2E8F0',
              overflowX: 'auto',
              fontSize: 12,
            }}
          >
            {result}
          </pre>
        )}
      </div>

      {/* Quick Links */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h3 style={{ color: '#E2E8F0', fontSize: '20px', marginBottom: '12px' }}>
          💻 Database Access
        </h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href="/admin/curriculum/"
            className="action-button"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Open Curriculum Ops →
          </a>
          <a
            href="https://supabase.com/dashboard/project/qkapwhyxcpgzahuemucg/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="action-button"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Open Supabase SQL Editor →
          </a>
        </div>
      </div>

      {/* Push Notifications */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ color: '#E2E8F0', fontSize: '20px', marginBottom: '12px' }}>
          🔔 Push Notifications (Due Cards)
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>
          Invokes the Supabase Edge Function <code style={{ color: '#00F5FF' }}>send-daily-due-cards</code>.
          <br />
          Optional: enter a user email to request debug output (only works if the function has <code style={{ color: '#00F5FF' }}>ALLOW_DUE_CARDS_DEBUG=true</code>).
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#94A3B8', fontSize: 14, display: 'block', marginBottom: 8 }}>
            Debug email (optional)
          </label>
          <input
            className="search-input"
            value={pushDebugEmail}
            onChange={(e) => setPushDebugEmail(e.target.value)}
            placeholder="e.g. tony@vespa.academy"
            style={{ maxWidth: 420 }}
          />
        </div>

        <button onClick={runDueCardsPushNow} disabled={loading} className="action-button">
          🚀 Run due-cards push job now
        </button>
      </div>
    </div>
  );
}

