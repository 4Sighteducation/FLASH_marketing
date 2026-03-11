import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

type PromoteBody = {
  board: string; // e.g. EDEXCEL
  qual: string; // e.g. A_LEVEL
  subjectCode: string; // e.g. 9PE1
  cleanupUnreferencedRemovedTopics?: boolean; // default true
};

function mapQualToStaging(qual: string): string {
  const m: Record<string, string> = {
    A_LEVEL: 'A-Level',
    GCSE: 'GCSE',
    INTERNATIONAL_GCSE: 'International GCSE',
    INTERNATIONAL_A_LEVEL: 'International A Level',
    NATIONAL_5: 'National 5',
    HIGHER: 'Higher',
    ADVANCED_HIGHER: 'Advanced Higher',
    LEVEL_3_EXTENDED_PROJECT: 'Level 3 Extended Project',
  };
  return m[qual] || qual;
}

function normName(x: unknown): string {
  let s = String(x || '');
  // Normalize replacement char and bullet variants so we can match legacy rows.
  s = s.replace(/\uFFFD/g, '•');
  s = s.replace(/●/g, '•');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/^(?:•|o|-)\s+/i, '');
  return s.trim();
}

function candidateNames(raw: string): string[] {
  const cands = new Set<string>();
  const s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (s) cands.add(s);
  cands.add(s.replace(/•/g, '\uFFFD'));
  cands.add(s.replace(/\uFFFD/g, '•'));
  cands.add(s.replace(/●/g, '•'));
  cands.add(s.replace(/●/g, '\uFFFD'));
  cands.add(s.replace(/^(?:•|\uFFFD|●|o|-)\s+/i, ''));
  return Array.from(cands).filter(Boolean);
}

async function fetchAll<T>(sb: any, table: string, select: string, filters: (q: any) => any, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  while (true) {
    let q = sb.from(table).select(select).range(from, from + pageSize - 1);
    q = filters(q);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (data || []) as T[];
    if (!rows.length) break;
    out.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

function sortTopicCodes(a: string, b: string) {
  // Natural-ish sort for dotted numeric codes (e.g. 4.1.10 after 4.1.2)
  const pa = String(a || '').split('.').map((x) => (x.match(/^\d+$/) ? Number(x) : x));
  const pb = String(b || '').split('.').map((x) => (x.match(/^\d+$/) ? Number(x) : x));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const xa = pa[i];
    const xb = pb[i];
    if (xa === undefined) return -1;
    if (xb === undefined) return 1;
    if (typeof xa === 'number' && typeof xb === 'number') {
      if (xa !== xb) return xa - xb;
    } else {
      const sa = String(xa);
      const sb = String(xb);
      if (sa !== sb) return sa.localeCompare(sb);
    }
  }
  return 0;
}

export async function POST(request: NextRequest) {
  let runId: string | undefined;
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    const adminUser = await requireAdminFromBearerToken(token);

    const body = (await request.json().catch(() => ({}))) as PromoteBody;
    const board = String(body.board || '').trim().toUpperCase();
    const qual = String(body.qual || '').trim().toUpperCase();
    const subjectCode = String(body.subjectCode || '').trim().toUpperCase();
    const cleanup = body.cleanupUnreferencedRemovedTopics !== false;

    if (!board || !qual || !subjectCode) {
      return NextResponse.json({ error: 'Missing board/qual/subjectCode' }, { status: 400 });
    }

    const sb = getServiceClient();

    // Log run start
    const { data: runRow, error: runErr } = await sb
      .from('curriculum_ops_runs')
      .insert({
        action: 'promote',
        status: 'running',
        exam_board: board,
        qualification_level: qual,
        subject_code: subjectCode,
        requested_by_email: adminUser.email,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();
    if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });
    runId = runRow?.id as string | undefined;

    // Resolve production FK ids
    const { data: eb, error: ebErr } = await sb.from('exam_boards').select('id,code').eq('code', board).maybeSingle();
    if (ebErr) return NextResponse.json({ error: ebErr.message }, { status: 500 });
    if (!eb?.id) return NextResponse.json({ error: `Unknown exam board ${board}` }, { status: 400 });

    const { data: qt, error: qtErr } = await sb.from('qualification_types').select('id,code').eq('code', qual).maybeSingle();
    if (qtErr) return NextResponse.json({ error: qtErr.message }, { status: 500 });
    if (!qt?.id) return NextResponse.json({ error: `Unknown qualification ${qual}` }, { status: 400 });

    // Resolve staging subject
    const stgQual = mapQualToStaging(qual);
    const { data: stgSub, error: stgSubErr } = await sb
      .from('staging_aqa_subjects')
      .select('id,subject_code,subject_name,exam_board,qualification_type')
      .eq('exam_board', board)
      .eq('qualification_type', stgQual)
      .eq('subject_code', subjectCode)
      .maybeSingle();
    if (stgSubErr) return NextResponse.json({ error: stgSubErr.message }, { status: 500 });
    if (!stgSub?.id) return NextResponse.json({ error: 'No staging subject found' }, { status: 404 });

    // Resolve / upsert production subject
    const { data: prodSub, error: prodSubErr } = await sb
      .from('exam_board_subjects')
      .upsert(
        {
          subject_code: subjectCode,
          subject_name: stgSub.subject_name,
          exam_board_id: eb.id,
          qualification_type_id: qt.id,
          is_current: true,
        },
        { onConflict: 'subject_code,exam_board_id,qualification_type_id' }
      )
      .select('id,subject_code,subject_name')
      .maybeSingle();
    if (prodSubErr) return NextResponse.json({ error: prodSubErr.message }, { status: 500 });
    if (!prodSub?.id) return NextResponse.json({ error: 'Failed to resolve production subject' }, { status: 500 });

    // Fetch staging topics
    type StgTopic = { id: string; topic_code: string; topic_name: string; topic_level: number; parent_topic_id: string | null };
    const stgTopics = await fetchAll<StgTopic>(
      sb,
      'staging_aqa_topics',
      'id,topic_code,topic_name,topic_level,parent_topic_id',
      (q) => q.eq('subject_id', stgSub.id).order('topic_level').order('topic_code')
    );
    if (!stgTopics.length) return NextResponse.json({ error: 'No staging topics found' }, { status: 400 });

    // Fetch production topics
    type ProdTopic = { id: string; topic_code: string | null; topic_name: string | null; topic_level: number | null };
    const prodTopics = await fetchAll<ProdTopic>(
      sb,
      'curriculum_topics',
      'id,topic_code,topic_name,topic_level',
      (q) => q.eq('exam_board_subject_id', prodSub.id)
    );

    const prodIdByCode = new Map<string, string>();
    const prodIdByLevelName = new Map<string, string>();
    for (const p of prodTopics) {
      if (p.topic_code) prodIdByCode.set(p.topic_code, p.id);
      const key = `${p.topic_level ?? 0}::${normName(p.topic_name)}`;
      if (normName(p.topic_name)) prodIdByLevelName.set(key, p.id);
    }

    // Deterministic sort_order (client-side)
    const stgSorted = [...stgTopics].sort((a, b) => {
      if (a.topic_level !== b.topic_level) return a.topic_level - b.topic_level;
      const ac = a.topic_code || '';
      const bc = b.topic_code || '';
      if (ac !== bc) return ac.localeCompare(bc);
      return a.id.localeCompare(b.id);
    });
    const sortOrderByStgId = new Map<string, number>();
    stgSorted.forEach((t, i) => sortOrderByStgId.set(t.id, i));

    // ------------------------------------------------------------
    // IMPORTANT: Promote level-by-level with real parent IDs.
    //
    // Production enforces a uniqueness constraint on:
    //   (exam_board_subject_id, parent_topic_id, topic_level, topic_name)
    //
    // If we temporarily set parent_topic_id = NULL for all rows, repeated bullet
    // names at the same level can collide before we patch relations. This is a
    // common failure mode for content-heavy specs (Economics, Biology, etc.).
    // ------------------------------------------------------------

    // Guardrail: staging topic_code should be unique within a subject
    const seenStgCodes = new Set<string>();
    const dupStgCodes: string[] = [];
    for (const t of stgTopics) {
      const c = String(t.topic_code || '').trim();
      if (!c) continue;
      if (seenStgCodes.has(c)) dupStgCodes.push(c);
      else seenStgCodes.add(c);
    }
    if (dupStgCodes.length) {
      return NextResponse.json(
        { error: 'Staging has duplicate topic_code values (cannot safely promote)', duplicates: Array.from(new Set(dupStgCodes)).slice(0, 50) },
        { status: 400 }
      );
    }

    const dedupeById = (rows: any[]) => {
      const m = new Map<string, any>();
      for (const r of rows) {
        if (!r?.id) continue;
        m.set(r.id, r); // last write wins
      }
      return Array.from(m.values());
    };

    // Map staging id -> staging code (for parent lookup)
    const stgCodeById = new Map<string, string>();
    stgTopics.forEach((t) => stgCodeById.set(t.id, t.topic_code));

    // Promote in increasing level order so parent IDs are known when we insert children
    const maxLevel = stgTopics.reduce((m, t) => Math.max(m, Number(t.topic_level || 0)), 0);

    // Use stable identity: topic_code (preferred), else staging id (fallback).
    // Keep a live code->prodId mapping as we insert.
    const prodIdByCodeLive = new Map<string, string>(prodIdByCode);

    const chunk = async (rows: any[], fn: (c: any[]) => Promise<void>, size = 1000) => {
      for (let i = 0; i < rows.length; i += size) {
        await fn(rows.slice(i, i + size));
      }
    };

    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const rowsAtLevel = stgTopics.filter((t) => t.topic_level === lvl).sort((a, b) => sortTopicCodes(a.topic_code, b.topic_code));
      if (!rowsAtLevel.length) continue;

      const upserts: any[] = [];
      for (const t of rowsAtLevel) {
        const code = String(t.topic_code || '').trim();
        const prodId = prodIdByCodeLive.get(code) || prodIdByCode.get(code) || t.id; // use staging id for new topics

        let parentProdId: string | null = null;
        if (t.parent_topic_id) {
          const parentCode = stgCodeById.get(t.parent_topic_id) || null;
          parentProdId = parentCode ? (prodIdByCodeLive.get(parentCode) || null) : null;
        }

        upserts.push({
          id: prodId,
          exam_board_subject_id: prodSub.id,
          topic_code: code,
          topic_name: t.topic_name,
          topic_level: t.topic_level,
          parent_topic_id: parentProdId,
          sort_order: sortOrderByStgId.get(t.id) || 0,
        });
      }

      await chunk(upserts, async (c) => {
        const { data, error } = await sb.from('curriculum_topics').upsert(dedupeById(c), { onConflict: 'id' }).select('id,topic_code');
        if (error) throw new Error(error.message);
        (data || []).forEach((row: any) => {
          if (row?.id && row?.topic_code) prodIdByCodeLive.set(row.topic_code, row.id);
        });
      });
    }

    // Refresh prod topic code->id map after inserts/updates
    const prodTopics2 = await fetchAll<ProdTopic>(
      sb,
      'curriculum_topics',
      'id,topic_code,topic_name,topic_level',
      (q) => q.eq('exam_board_subject_id', prodSub.id)
    );
    const prodIdByCode2 = new Map<string, string>();
    for (const p of prodTopics2) {
      if (p.topic_code) prodIdByCode2.set(p.topic_code, p.id);
    }

    // Patch parent relationships
    let parentLinksUpdated = 0;
    for (const t of stgTopics) {
      if (!t.parent_topic_id) continue;
      const childProdId = prodIdByCode2.get(t.topic_code);
      const parentCode = stgCodeById.get(t.parent_topic_id);
      const parentProdId = parentCode ? prodIdByCode2.get(parentCode) : null;
      if (!childProdId || !parentProdId) continue;
      const { error } = await sb.from('curriculum_topics').update({ parent_topic_id: parentProdId }).eq('id', childProdId);
      if (error) throw new Error(error.message);
      parentLinksUpdated += 1;
    }

    // Cleanup removed topics if requested AND they have no flashcards
    let deletedRemoved = 0;
    let keptRemoved = 0;
    if (cleanup) {
      const stgCodes = new Set(stgTopics.map((t) => t.topic_code));
      for (const p of prodTopics2) {
        if (!p.topic_code) continue;
        if (stgCodes.has(p.topic_code)) continue;
        // Check flashcards reference
        const { count, error } = await sb.from('flashcards').select('id', { count: 'exact', head: true }).eq('topic_id', p.id);
        if (error) {
          keptRemoved += 1;
          continue;
        }
        if ((count || 0) > 0) {
          keptRemoved += 1;
          continue;
        }
        const { error: delErr } = await sb.from('curriculum_topics').delete().eq('id', p.id);
        if (delErr) {
          keptRemoved += 1;
          continue;
        }
        deletedRemoved += 1;
      }
    }

    const payload = {
      ok: true,
      productionSubjectId: prodSub.id,
      stagingSubjectId: stgSub.id,
      stagingTopics: stgTopics.length,
      productionTopicsAfter: prodTopics2.length,
      parentLinksUpdated,
      cleanup: { deletedRemoved, keptRemoved },
      note: 'Embeddings regeneration is available via the Embeddings button (runs an edge function).',
    };

    if (runId) {
      await sb
        .from('curriculum_ops_runs')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          summary_json: payload,
        })
        .eq('id', runId);
    }

    return NextResponse.json(payload);
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    try {
      if (runId) {
        const sb2 = getServiceClient();
        await sb2
          .from('curriculum_ops_runs')
          .update({ status: 'error', finished_at: new Date().toISOString(), error_text: msg })
          .eq('id', runId);
      }
    } catch {
      // ignore logging failures
    }
    const status = msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

