'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTurnstile } from '../lib/turnstileClient';
import TurnstileFallbackBox from '../components/TurnstileFallbackBox';

function ParentsPageInner() {
  const searchParams = useSearchParams();
  const [childEmail, setChildEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const { blocked, fallbackVisible, invisibleRef, fallbackRef, getToken, reset } = useTurnstile({
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY,
    action: 'parent_checkout',
  });

  const canSubmit = useMemo(() => childEmail.trim().length > 3 && childEmail.includes('@'), [childEmail]);

  useEffect(() => {
    const fromQuery = (searchParams?.get('child_email') || '').trim();
    if (fromQuery && fromQuery.includes('@')) setChildEmail(fromQuery);
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError(null);

    try {
      const turnstileToken = await getToken();
      if (!turnstileToken) {
        if (blocked) setError('Spam protection is blocked on this network. Please email us at support@fl4shcards.com.');
        return;
      }

      const res = await fetch('/api/parent-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childEmail, turnstileToken, website, formStartedAt }),
      });
      const json = await res.json();
      if (!res.ok || !json?.url) {
        setError(json?.error || 'Could not start checkout.');
        return;
      }
      reset();
      window.location.href = json.url;
    } catch (err: any) {
      setError(err?.message || 'Could not start checkout.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Keep your child studying like a Pro</h1>
      <p style={{ opacity: 0.85, marginBottom: 28 }}>
        Your child gets Pro free for their first 30 days. If they want to keep Pro afterwards, you can pay here.
      </p>

      <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 20 }}>
        <h2 style={{ fontSize: 20, marginTop: 0 }}>Pro (Annual)</h2>
        <p style={{ margin: '6px 0 18px 0', opacity: 0.85 }}>£39.99 / year (2 months free)</p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <div style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }} aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Child’s email address</span>
            <input
              value={childEmail}
              onChange={(e) => setChildEmail(e.target.value)}
              placeholder="child@example.com"
              type="email"
              required
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.25)',
                color: 'white',
                fontSize: 16,
              }}
            />
          </label>

          {error ? <div style={{ color: '#ffb4b4', fontSize: 14 }}>{error}</div> : null}
          <TurnstileFallbackBox
            blocked={blocked}
            fallbackVisible={fallbackVisible}
            invisibleRef={invisibleRef}
            fallbackRef={fallbackRef}
            mailto="support@fl4shcards.com"
            contactLabel="email us"
            contextLabel="spam protection"
          />

          <button
            type="submit"
            disabled={!canSubmit || loading}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: 'none',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              background: 'linear-gradient(90deg, #00e5ff, #ff4fd8)',
              color: '#111',
            }}
          >
            {loading ? 'Redirecting…' : 'Continue to secure checkout'}
          </button>
        </form>

        <p style={{ fontSize: 13, opacity: 0.75, marginTop: 14 }}>
          After checkout, we’ll email your child a redeem link and code. They’ll sign in (including Sign in with Apple) and
          unlock Pro. You can cancel anytime.
        </p>
      </div>
    </main>
  );
}

export default function ParentsPage() {
  return (
    <Suspense>
      <ParentsPageInner />
    </Suspense>
  );
}
