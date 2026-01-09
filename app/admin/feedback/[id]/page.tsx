'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../../../lib/adminClient';
import { sections as surveySections, type Question, type QuestionType } from '../../../../lib/surveys/testerFeedbackV1';

type FeedbackRow = {
  id: number;
  created_at: string | null;
  survey_key: string | null;
  status: string | null;
  user_id: string | null;
  answers: any;
  meta: any;
};

type DetailResponse = { row: FeedbackRow };

function fmt(dt: string | null): string {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

function isEmptyValue(v: any): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function prettyValue(type: QuestionType | 'unknown', v: any): { primary: string; secondary?: string } {
  if (type === 'boolean') {
    if (typeof v === 'boolean') return { primary: v ? 'Yes' : 'No' };
    return { primary: String(v ?? '') };
  }
  if (type === 'multi_choice') {
    if (Array.isArray(v)) return { primary: v.join(', ') };
    return { primary: String(v ?? '') };
  }
  if (type === 'rating_1_7') {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return { primary: String(v ?? '') };
    return { primary: String(n), secondary: '/ 7' };
  }
  return { primary: typeof v === 'string' ? v : JSON.stringify(v) };
}

function chip(text: string) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid rgba(148,163,184,0.35)',
        background: 'rgba(255,255,255,0.03)',
        color: '#E2E8F0',
        fontWeight: 800,
        fontSize: 12,
        maxWidth: '100%',
        overflowWrap: 'anywhere',
      }}
    >
      {text}
    </span>
  );
}

export default function AdminFeedbackDetailPage({ params }: { params: { id: string } }) {
  const id = String(params?.id || '');
  const [row, setRow] = useState<FeedbackRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Hooks must run on every render (even while loading), otherwise React will throw (#310).
  const metaById = useMemo(() => {
    const m = new Map<string, { sectionTitle: string; q: Question }>();
    for (const sec of surveySections) {
      for (const q of sec.questions) {
        m.set(q.id, { sectionTitle: sec.title, q });
      }
    }

    // Legacy / earlier-key aliases seen in the DB (best-effort mapping)
    const alias: Record<string, string> = {
      overall_loved: 'overall_loved_pick',
      overall_change_first: 'overall_change_first_pick',
      auth_issues: 'auth_issues_level',
      onboarding_confusing: 'onboarding_confusing_level',
      study_confusing: 'study_confusing_pick',
      create_ai_quality: 'create_ai_quality_pick',
      top_3_improvements: 'top_improvements',
    };

    for (const [legacyId, canonicalId] of Object.entries(alias)) {
      const got = m.get(canonicalId);
      if (got && !m.has(legacyId)) m.set(legacyId, got);
    }

    return m;
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await adminFetch<DetailResponse>(`/api/admin/feedback/${encodeURIComponent(id)}`);
        setRow(res.row);
      } catch (e: any) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div><p>Loading…</p></div>;
  if (err) return <div style={{ color: '#FF4FD8', fontWeight: 900 }}>{err}</div>;
  if (!row) return <div style={{ color: '#94A3B8' }}>Not found.</div>;

  const a = (row.answers || {}) as any;
  const tellMoreKey = (qid: string) => `${qid}_tell_more`;
  const internalKeys = new Set(['participant_name', 'participant_email', 'claim_voucher', 'consent', 'follow_up_ok']);
  const displayedKeys = new Set<string>();

  const highlights = [
    { key: 'overall_satisfaction_1_10', label: 'Satisfaction', type: 'single_choice' as const },
    { key: 'nps_0_10', label: 'Recommend (0–10)', type: 'single_choice' as const },
    { key: 'overall_loved_pick', label: 'Loved most', type: 'single_choice' as const, fallback: 'overall_loved' },
    { key: 'overall_change_first_pick', label: 'Change first', type: 'single_choice' as const, fallback: 'overall_change_first' },
    { key: 'top_improvements', label: 'Top improvements', type: 'multi_choice' as const, fallback: 'top_3_improvements' },
  ];

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          📝 Feedback #{row.id}
        </h2>
        <a className="action-button" href="/admin/feedback">
          ← Back
        </a>
      </div>

      <div className="feedback-grid">
        <aside className="feedback-sidebar">
          <div className="feedback-card">
            <div className="feedback-card-title">Submission</div>
            <div className="feedback-kv">
              <div className="feedback-kv-label">Time</div>
              <div className="feedback-kv-value">{fmt(row.created_at)}</div>

              <div className="feedback-kv-label">Survey</div>
              <div className="feedback-kv-value">{row.survey_key || '—'}</div>

              <div className="feedback-kv-label">Status</div>
              <div className="feedback-kv-value">{row.status || '—'}</div>

              <div className="feedback-kv-label">Name</div>
              <div className="feedback-kv-value">{a.participant_name || '—'}</div>

              <div className="feedback-kv-label">Email</div>
              <div className="feedback-kv-value" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>{a.participant_email || '—'}</span>
                {typeof a.participant_email === 'string' && a.participant_email.trim() ? (
                  <button
                    type="button"
                    className="action-button"
                    style={{ padding: '8px 12px' }}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(String(a.participant_email));
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Copy
                  </button>
                ) : null}
              </div>

              <div className="feedback-kv-label">Voucher</div>
              <div className="feedback-kv-value">{a.claim_voucher === true ? 'Yes' : a.claim_voucher === false ? 'No' : '—'}</div>
            </div>
          </div>

          <div className="feedback-card">
            <div className="feedback-card-title">Highlights</div>
            <div className="feedback-highlights">
              {highlights.map((h) => {
                const val = !isEmptyValue(a[h.key]) ? a[h.key] : h.fallback ? a[h.fallback] : undefined;
                if (isEmptyValue(val)) return null;
                displayedKeys.add(h.key);
                if (h.fallback) displayedKeys.add(h.fallback);
                const p = prettyValue(h.type, val);
                const tm = a[tellMoreKey(h.key)] || (h.fallback ? a[tellMoreKey(h.fallback)] : '');
                return (
                  <div key={h.key} className="feedback-highlight-row">
                    <div className="feedback-highlight-label">{h.label}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {chip(p.primary + (p.secondary || ''))}
                      {typeof tm === 'string' && tm.trim() ? (
                        <span className="feedback-note" style={{ maxWidth: 260 }}>
                          {tm.trim()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="feedback-card">
            <div className="feedback-card-title">Jump to</div>
            <div className="feedback-links">
              {surveySections.map((s) => (
                <a key={s.id} href={`#sec-${s.id}`} className="feedback-link">
                  {s.title}
                </a>
              ))}
              <a href="#other-fields" className="feedback-link">
                Other
              </a>
              <a href="#raw-json" className="feedback-link">
                Raw JSON
              </a>
            </div>
          </div>
        </aside>

        <main className="feedback-main">
          {surveySections.map((sec) => {
            const items = sec.questions
              .map((q) => {
                const v = a[q.id];
                const tm = a[tellMoreKey(q.id)];
                if (isEmptyValue(v) && isEmptyValue(tm)) return null;
                return { q, v, tm };
              })
              .filter(Boolean) as Array<{ q: Question; v: any; tm: any }>;

            const answeredCount = items.length;
            const total = sec.questions.length;
            if (answeredCount === 0) return null;

            const openByDefault = sec.id === 'overall' || sec.id === 'capture';

            return (
              <details key={sec.id} id={`sec-${sec.id}`} className="feedback-section" open={openByDefault}>
                <summary>
                  <span>{sec.title}</span>
                  <span className="feedback-section-meta">
                    {answeredCount} / {total}
                  </span>
                </summary>
                <div className="feedback-section-body">
                  <table className="admin-table feedback-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#E2E8F0' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: 12, width: '44%' }}>Question</th>
                        <th style={{ padding: 12, width: '26%' }}>Answer</th>
                        <th style={{ padding: 12, width: '30%' }}>Tell us more</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(({ q, v, tm }) => {
                        displayedKeys.add(q.id);
                        if (!isEmptyValue(tm)) displayedKeys.add(tellMoreKey(q.id));
                        const pv = prettyValue(q.type, v);
                        return (
                          <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: 12 }}>
                              <div className="feedback-q">{q.prompt}</div>
                            </td>
                            <td style={{ padding: 12 }}>
                              {isEmptyValue(v) ? <span className="feedback-note">—</span> : chip(pv.primary + (pv.secondary || ''))}
                            </td>
                            <td style={{ padding: 12 }}>
                              {typeof tm === 'string' && tm.trim() ? <div className="feedback-note">{tm.trim()}</div> : <span className="feedback-note">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}

          <details id="other-fields" className="feedback-section">
            <summary>
              <span>Other fields</span>
              <span className="feedback-section-meta">legacy/unmapped</span>
            </summary>
            <div className="feedback-section-body">
              <div className="feedback-note" style={{ marginBottom: 10 }}>
                Keys we couldn’t confidently map to the current survey definition (often from older versions).
              </div>
              <table className="admin-table feedback-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#E2E8F0' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: 12, width: '44%' }}>Field</th>
                    <th style={{ padding: 12, width: '56%' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(a || {})
                    .sort()
                    .filter((k) => !internalKeys.has(k))
                    .filter((k) => !displayedKeys.has(k))
                    .map((k) => {
                      const meta = metaById.get(k);
                      const label = meta?.q?.prompt ? `${meta.sectionTitle} · ${meta.q.prompt}` : k.replace(/_/g, ' ');
                      const type = meta?.q?.type || ('unknown' as const);
                      const pv = prettyValue(type as any, a[k]);
                      return (
                        <tr key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: 12 }}>
                            <div className="feedback-q">{label}</div>
                          </td>
                          <td style={{ padding: 12 }}>{chip(pv.primary + (pv.secondary || ''))}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </details>

          <details id="raw-json" className="feedback-section">
            <summary>
              <span>Raw JSON</span>
              <span className="feedback-section-meta">debug</span>
            </summary>
            <div className="feedback-section-body">
              <div style={{ display: 'grid', gap: 12 }}>
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 900, color: '#E2E8F0' }}>answers</summary>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#E2E8F0', marginTop: 10 }}>
                    {JSON.stringify(row.answers || {}, null, 2)}
                  </pre>
                </details>
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 900, color: '#E2E8F0' }}>meta</summary>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#E2E8F0', marginTop: 10 }}>
                    {JSON.stringify(row.meta || {}, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </details>
        </main>
      </div>
    </div>
  );
}

