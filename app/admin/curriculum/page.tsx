'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../../lib/adminClient';

type EnvMode = 'production' | 'staging';

type SubjectRow = {
  id: string;
  subject_code: string;
  subject_name: string;
  is_current?: boolean;
};

type TopicRow = {
  id: string;
  topic_code: string | null;
  topic_name: string | null;
  display_name?: string | null;
  topic_level: number | null;
  parent_topic_id: string | null;
  sort_order?: number | null;
};

const BOARDS = ['AQA', 'OCR', 'EDEXCEL', 'WJEC', 'EDUQAS', 'CCEA', 'SQA'];
const QUALS = [
  'A_LEVEL',
  'GCSE',
  'INTERNATIONAL_GCSE',
  'INTERNATIONAL_A_LEVEL',
  'NATIONAL_5',
  'HIGHER',
  'ADVANCED_HIGHER',
  'LEVEL_3_EXTENDED_PROJECT',
];

function escapeHtml(s: any) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function indent(level: number) {
  return { paddingLeft: `${Math.max(0, level) * 16}px` };
}

export default function CurriculumOpsPage() {
  const [env, setEnv] = useState<EnvMode>('production');
  const [board, setBoard] = useState('EDEXCEL');
  const [qual, setQual] = useState('A_LEVEL');
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectRow | null>(null);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compare, setCompare] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = async () => {
    setError(null);
    setLoadingSubjects(true);
    setSelectedSubject(null);
    setTopics([]);
    setCompare(null);
    try {
      const res = await adminFetch<{ rows: SubjectRow[] }>(
        `/api/admin/curriculum/subjects?env=${env}&board=${encodeURIComponent(board)}&qual=${encodeURIComponent(qual)}`
      );
      setSubjects(res.rows || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load subjects');
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadTopics = async (subject: SubjectRow) => {
    setError(null);
    setLoadingTopics(true);
    setCompare(null);
    try {
      const res = await adminFetch<{ rows: TopicRow[] }>(
        `/api/admin/curriculum/topics?env=${env}&subjectId=${encodeURIComponent(subject.id)}`
      );
      setTopics(res.rows || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load topics');
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  };

  const runCompare = async () => {
    if (!selectedSubject) return;
    setCompareLoading(true);
    setError(null);
    try {
      const res = await adminFetch<any>(
        `/api/admin/curriculum/compare?board=${encodeURIComponent(board)}&qual=${encodeURIComponent(qual)}&subjectCode=${encodeURIComponent(
          selectedSubject.subject_code
        )}`
      );
      setCompare(res);
    } catch (e: any) {
      setError(e?.message || 'Compare failed');
      setCompare(null);
    } finally {
      setCompareLoading(false);
    }
  };

  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteResult, setPromoteResult] = useState<any>(null);

  const runPromote = async () => {
    if (!selectedSubject) return;
    const ok = window.confirm(
      `Promote subject ${selectedSubject.subject_code} (${selectedSubject.subject_name}) from STAGING → PRODUCTION?\n\nThis updates production topics and may delete removed topics only if they have zero flashcards.`
    );
    if (!ok) return;
    setPromoteLoading(true);
    setPromoteResult(null);
    setError(null);
    try {
      const res = await adminFetch<any>(`/api/admin/curriculum/promote`, {
        method: 'POST',
        body: JSON.stringify({
          board,
          qual,
          subjectCode: selectedSubject.subject_code,
          cleanupUnreferencedRemovedTopics: true,
        }),
      });
      setPromoteResult(res);
      // Refresh prod topics if we're currently viewing production
      if (env === 'production') {
        await loadTopics(selectedSubject);
      }
      // Refresh compare snapshot
      await runCompare();
    } catch (e: any) {
      setError(e?.message || 'Promote failed');
    } finally {
      setPromoteLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, board, qual]);

  const displayTopics = useMemo(() => {
    // Build a small tree for nicer display ordering in UI
    const byId = new Map<string, any>();
    const roots: any[] = [];
    topics.forEach((t) => byId.set(t.id, { ...t, children: [] }));
    topics.forEach((t) => {
      const node = byId.get(t.id);
      if (t.parent_topic_id) {
        const parent = byId.get(t.parent_topic_id);
        if (parent) parent.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });
    const sort = (nodes: any[]) => {
      nodes.sort((a, b) => {
        const la = a.topic_level ?? 0;
        const lb = b.topic_level ?? 0;
        if (la !== lb) return la - lb;
        const sa = a.sort_order ?? 0;
        const sb = b.sort_order ?? 0;
        if (sa !== sb) return sa - sb;
        return String(a.topic_code || '').localeCompare(String(b.topic_code || ''));
      });
      nodes.forEach((n) => n.children && sort(n.children));
    };
    sort(roots);
    const flat: any[] = [];
    const walk = (nodes: any[], depth = 0) => {
      nodes.forEach((n) => {
        flat.push({ ...n, _depth: depth });
        if (n.children?.length) walk(n.children, depth + 1);
      });
    };
    walk(roots, 0);
    return flat;
  }, [topics]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <h2 className="section-title">🧬 Curriculum Ops</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="action-button" onClick={loadSubjects} disabled={loadingSubjects}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <label style={{ color: '#94A3B8', fontWeight: 700 }}>Env:</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="action-button"
              style={{ opacity: env === 'production' ? 1 : 0.6 }}
              onClick={() => setEnv('production')}
            >
              Production
            </button>
            <button
              className="action-button"
              style={{ opacity: env === 'staging' ? 1 : 0.6 }}
              onClick={() => setEnv('staging')}
            >
              Staging
            </button>
          </div>

          <label style={{ color: '#94A3B8', fontWeight: 700, marginLeft: 10 }}>Board:</label>
          <select value={board} onChange={(e) => setBoard(e.target.value)} className="admin-select">
            {BOARDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <label style={{ color: '#94A3B8', fontWeight: 700, marginLeft: 10 }}>Qual:</label>
          <select value={qual} onChange={(e) => setQual(e.target.value)} className="admin-select">
            {QUALS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>

          <span style={{ marginLeft: 'auto', color: '#64748B', fontSize: 12 }}>
            Tip: use <b>Compare</b> to diff staging vs production for the selected subject code.
          </span>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ padding: 14, borderColor: 'rgba(255,0,110,0.35)', background: 'rgba(255,0,110,0.06)' }}>
          <div style={{ color: '#FF006E', fontWeight: 800 }}>Error</div>
          <div style={{ color: '#94A3B8', marginTop: 6 }}>{error}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
        <div className="admin-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              📚 Subjects
            </h3>
            <div style={{ color: '#64748B', fontSize: 12 }}>{loadingSubjects ? 'Loading…' : `${subjects.length} total`}</div>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10, maxHeight: 520, overflow: 'auto', paddingRight: 6 }}>
            {subjects.map((s) => (
              <button
                key={s.id}
                className="admin-subject"
                onClick={() => {
                  setSelectedSubject(s);
                  loadTopics(s);
                }}
                style={{ textAlign: 'left', opacity: selectedSubject?.id === s.id ? 1 : 0.9 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ color: '#E2E8F0', fontWeight: 800 }}>{s.subject_name}</div>
                  <div style={{ color: '#00F5FF', fontFamily: 'monospace', fontWeight: 800 }}>{s.subject_code}</div>
                </div>
                {typeof s.is_current === 'boolean' && (
                  <div style={{ marginTop: 6, color: '#64748B', fontSize: 12 }}>{s.is_current ? 'current' : 'archived'}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              🧾 Topics
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {selectedSubject && (
                <button className="action-button" onClick={runCompare} disabled={compareLoading}>
                  🧮 Compare
                </button>
              )}
              {selectedSubject && (
                <button className="action-button" onClick={runPromote} disabled={promoteLoading}>
                  🚀 Promote
                </button>
              )}
              <div style={{ color: '#64748B', fontSize: 12 }}>{loadingTopics ? 'Loading…' : `${topics.length} topics`}</div>
            </div>
          </div>

          {!selectedSubject && <div style={{ color: '#94A3B8', marginTop: 12 }}>Select a subject to view topics.</div>}

          {selectedSubject && (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#94A3B8', fontSize: 12 }}>
                Showing <b>{env}</b> topics for <b>{escapeHtml(selectedSubject.subject_name)}</b> (<span style={{ fontFamily: 'monospace' }}>{selectedSubject.subject_code}</span>)
              </div>

              <div style={{ marginTop: 10, maxHeight: 360, overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94A3B8', fontSize: 12 }}>Code</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94A3B8', fontSize: 12 }}>Level</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94A3B8', fontSize: 12 }}>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayTopics.map((t: any) => (
                      <tr key={t.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '8px 12px', color: '#00F5FF', fontFamily: 'monospace' }}>{t.topic_code || ''}</td>
                        <td style={{ padding: '8px 12px', color: '#94A3B8', fontFamily: 'monospace' }}>L{t.topic_level ?? ''}</td>
                        <td style={{ padding: '8px 12px', color: '#E2E8F0', ...indent(t._depth || 0) }}>
                          {(t.display_name || t.topic_name || '').toString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {compare?.diff && (
                <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(0,245,255,0.18)', background: 'rgba(0,245,255,0.06)' }}>
                  <div style={{ color: '#00F5FF', fontWeight: 900 }}>Compare (production vs staging)</div>
                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(140px, 1fr))', gap: 10 }}>
                    <div>
                      <div style={{ color: '#94A3B8', fontSize: 12 }}>prod topics</div>
                      <div style={{ fontSize: 24, fontWeight: 900 }}>{compare.diff.prodTopics}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94A3B8', fontSize: 12 }}>staging topics</div>
                      <div style={{ fontSize: 24, fontWeight: 900 }}>{compare.diff.stgTopics}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94A3B8', fontSize: 12 }}>missing in prod</div>
                      <div style={{ fontSize: 24, fontWeight: 900 }}>{compare.diff.missingInProd.length}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94A3B8', fontSize: 12 }}>missing in staging</div>
                      <div style={{ fontSize: 24, fontWeight: 900 }}>{compare.diff.missingInStg.length}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94A3B8', fontSize: 12 }}>name diffs</div>
                      <div style={{ fontSize: 24, fontWeight: 900 }}>{compare.diff.nameDiffs.length}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, color: '#94A3B8', fontSize: 12 }}>
                    counts by level: prod {JSON.stringify(compare.diff.countsByLevel.production)} • stg{' '}
                    {JSON.stringify(compare.diff.countsByLevel.staging)}
                  </div>
                </div>
              )}

              {promoteResult?.ok && (
                <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.06)' }}>
                  <div style={{ color: '#10B981', fontWeight: 900 }}>Promotion complete</div>
                  <div style={{ marginTop: 8, color: '#94A3B8', fontSize: 12 }}>
                    staging topics: <b>{promoteResult.stagingTopics}</b> • production topics: <b>{promoteResult.productionTopicsAfter}</b> • parent links updated:{' '}
                    <b>{promoteResult.parentLinksUpdated}</b> • cleanup deleted: <b>{promoteResult.cleanup?.deletedRemoved ?? 0}</b>
                  </div>
                  {promoteResult.note && <div style={{ marginTop: 8, color: '#64748B', fontSize: 12 }}>{promoteResult.note}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

