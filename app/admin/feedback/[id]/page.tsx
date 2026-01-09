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

  const metaById = useMemo(() => {
    const m = new Map<string, { sectionId: string; sectionTitle: string; q: Question }>();
    for (const sec of surveySections) {
      for (const q of sec.questions) {
        m.set(q.id, { sectionId: sec.id, sectionTitle: sec.title, q });
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">📝 Feedback #{row.id}</h2>
        <a className="action-button" href="/admin/feedback">← Back</a>
      </div>

      <div className="stat-card" style={{ display: 'grid', gap: 8 }}>
        <div style={{ color: '#94A3B8', fontWeight: 800 }}>
          {fmt(row.created_at)} • survey_key: <span style={{ color: '#E2E8F0' }}>{row.survey_key || '—'}</span> • status:{' '}
          <span style={{ color: '#E2E8F0' }}>{row.status || '—'}</span>
        </div>
        <div style={{ color: '#94A3B8', fontWeight: 800 }}>
          Name: <span style={{ color: '#E2E8F0' }}>{a.participant_name || '—'}</span> • Email:{' '}
          <span style={{ color: '#E2E8F0' }}>{a.participant_email || '—'}</span> • Voucher:{' '}
          <span style={{ color: '#E2E8F0' }}>{a.claim_voucher === true ? 'Yes' : a.claim_voucher === false ? 'No' : '—'}</span>
        </div>
      </div>

      {/* Friendly report */}
      <div className="stat-card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ fontWeight: 900, color: '#E2E8F0' }}>Highlights</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {highlights.map((h) => {
            const val = !isEmptyValue(a[h.key]) ? a[h.key] : h.fallback ? a[h.fallback] : undefined;
            if (isEmptyValue(val)) return null;
            displayedKeys.add(h.key);
            if (h.fallback) displayedKeys.add(h.fallback);
            const p = prettyValue(h.type, val);
            const tm = a[tellMoreKey(h.key)] || (h.fallback ? a[tellMoreKey(h.fallback)] : '');
            return (
              <div key={h.key} style={{ display: 'grid', gap: 6, minWidth: 220 }}>
                <div style={{ color: '#94A3B8', fontWeight: 800 }}>{h.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  {chip(p.primary + (p.secondary || ''))}
                  {typeof tm === 'string' && tm.trim() ? (
                    <span style={{ color: '#E2E8F0', fontWeight: 800, fontSize: 13 }}>— {tm.trim()}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stat-card" style={{ display: 'grid', gap: 14 }}>
        <div style={{ fontWeight: 900, color: '#E2E8F0' }}>Responses</div>
        <div style={{ display: 'grid', gap: 14 }}>
          {surveySections.map((sec) => {
            const items = sec.questions
              .map((q) => {
                const v = a[q.id];
                const has = !isEmptyValue(v);
                const legacyV = has ? undefined : a[q.id]; // noop; keep shape
                const usedId = has ? q.id : q.id;
                const tm = a[tellMoreKey(usedId)];
                if (isEmptyValue(v) && isEmptyValue(tm)) return null;
                return { q, v, usedId, tm };
              })
              .filter(Boolean) as Array<{ q: Question; v: any; usedId: string; tm: any }>;

            if (items.length === 0) return null;

            return (
              <div key={sec.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                <div style={{ fontWeight: 900, color: '#E2E8F0', marginBottom: 10 }}>{sec.title}</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {items.map(({ q, v, tm }) => {
                    displayedKeys.add(q.id);
                    if (!isEmptyValue(tm)) displayedKeys.add(tellMoreKey(q.id));
                    const pv = prettyValue(q.type, v);
                    return (
                      <div key={q.id} style={{ display: 'grid', gap: 6 }}>
                        <div style={{ color: '#94A3B8', fontWeight: 800 }}>{q.prompt}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10 }}>
                          {chip(pv.primary + (pv.secondary || ''))}
                          {typeof tm === 'string' && tm.trim() ? (
                            <div style={{ color: '#E2E8F0', fontWeight: 800, fontSize: 13 }}>{tm.trim()}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unmapped / legacy keys */}
      <div className="stat-card" style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontWeight: 900, color: '#E2E8F0' }}>Other fields</div>
        <div style={{ color: '#94A3B8', fontWeight: 800 }}>
          These are keys we couldn’t confidently map to the current survey definition (often from older versions).
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
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
                <div key={k} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <span style={{ color: '#94A3B8', fontWeight: 900 }}>{label}:</span>
                  {chip(pv.primary + (pv.secondary || ''))}
                </div>
              );
            })}
        </div>
      </div>

      {/* Raw JSON for debugging */}
      <div className="stat-card" style={{ display: 'grid', gap: 12 }}>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 900, color: '#E2E8F0' }}>Raw JSON (answers)</summary>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#E2E8F0', marginTop: 10 }}>
            {JSON.stringify(row.answers || {}, null, 2)}
          </pre>
        </details>
      </div>

      <div className="stat-card" style={{ display: 'grid', gap: 12 }}>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 900, color: '#E2E8F0' }}>Raw JSON (meta)</summary>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#E2E8F0', marginTop: 10 }}>
            {JSON.stringify(row.meta || {}, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

