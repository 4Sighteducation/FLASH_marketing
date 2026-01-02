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

    // Guardrail: production enforces uniqueness on (exam_board_subject_id, topic_name, topic_level)
    // If staging has duplicates (same level + same trimmed name), promotion cannot be done safely.
    const seenLevelName = new Map<string, string>(); // key -> first topic_code
    const dupLevelName: Array<{ topic_level: number; topic_name: string; codes: string[] }> = [];
    for (const t of stgTopics) {
      const nameKey = `${t.topic_level}::${String(t.topic_name || '').replace(/\s+/g, ' ').trim()}`;
      const prev = seenLevelName.get(nameKey);
      if (prev) {
        const existing = dupLevelName.find((d) => `${d.topic_level}::${d.topic_name}` === nameKey);
        if (existing) existing.codes.push(t.topic_code);
        else dupLevelName.push({ topic_level: t.topic_level, topic_name: String(t.topic_name || '').replace(/\s+/g, ' ').trim(), codes: [prev, t.topic_code] });
      } else {
        seenLevelName.set(nameKey, t.topic_code);
      }
    }
    if (dupLevelName.length) {
      if (runId) {
        await sb
          .from('curriculum_ops_runs')
          .update({
            status: 'error',
            finished_at: new Date().toISOString(),
            error_text: 'Staging has duplicate (topic_level, topic_name) values; cannot promote safely.',
            summary_json: { duplicates: dupLevelName.slice(0, 50) },
          })
          .eq('id', runId);
      }
      return NextResponse.json(
        {
          error: 'Staging has duplicate topic names at the same level (production unique constraint would be violated). Fix staging/scraper, then retry.',
          duplicates: dupLevelName.slice(0, 50),
        },
        { status: 400 }
      );
    }

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

    // Build upserts/insert rows reusing IDs by code then by (level,name)
    const existingUpdates: any[] = [];
    const newRows: any[] = [];
    const usedProdIds = new Set<string>();

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

    for (const t of stgTopics) {
      const code = t.topic_code;
      let prodId = prodIdByCode.get(code);
      if (!prodId) {
        const key = `${t.topic_level}::${normName(t.topic_name)}`;
        prodId = prodIdByLevelName.get(key);
      }
      // Never allow two staging topics to map to the same production topic id in one run
      if (prodId && usedProdIds.has(prodId)) {
        prodId = undefined;
      }
      if (prodId) {
        usedProdIds.add(prodId);
        existingUpdates.push({
          id: prodId,
          exam_board_subject_id: prodSub.id,
          topic_code: code,
          topic_name: t.topic_name,
          topic_level: t.topic_level,
          parent_topic_id: null,
          sort_order: sortOrderByStgId.get(t.id) || 0,
        });
      } else {
        newRows.push({
          exam_board_subject_id: prodSub.id,
          topic_code: code,
          topic_name: t.topic_name,
          topic_level: t.topic_level,
          parent_topic_id: null,
          sort_order: sortOrderByStgId.get(t.id) || 0,
        });
      }
    }

    // Upsert existing by id
    const chunk = async (rows: any[], fn: (c: any[]) => Promise<void>, size = 1000) => {
      for (let i = 0; i < rows.length; i += size) {
        await fn(rows.slice(i, i + size));
      }
    };

    await chunk(existingUpdates, async (c) => {
      const { error } = await sb.from('curriculum_topics').upsert(dedupeById(c), { onConflict: 'id' });
      if (error) throw new Error(error.message);
    });

    // Before inserting new rows, try to match exact (level,name) with bullet variants to avoid unique collisions.
    const trulyNew: any[] = [];
    for (const r of newRows) {
      const lvl = r.topic_level;
      const names = candidateNames(r.topic_name);
      const { data: maybe, error } = await sb
        .from('curriculum_topics')
        .select('id,topic_name')
        .eq('exam_board_subject_id', prodSub.id)
        .eq('topic_level', lvl)
        .in('topic_name', names)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (maybe?.id) {
        if (usedProdIds.has(maybe.id)) {
          // If we've already updated this prod row in this run, treat this as truly new
          trulyNew.push(r);
        } else {
          existingUpdates.push({ ...r, id: maybe.id });
          usedProdIds.add(maybe.id);
        }
      } else {
        trulyNew.push(r);
      }
    }

    // Upsert any converted rows
    if (existingUpdates.length) {
      await chunk(existingUpdates, async (c) => {
        const { error } = await sb.from('curriculum_topics').upsert(dedupeById(c), { onConflict: 'id' });
        if (error) throw new Error(error.message);
      });
    }

    // Insert truly new rows
    await chunk(trulyNew, async (c) => {
      // Extra safety: dedupe within the chunk on the production unique key
      const keyToRow = new Map<string, any>();
      for (const r of c) {
        const k = `${r.exam_board_subject_id}::${r.topic_level}::${String(r.topic_name || '').replace(/\s+/g, ' ').trim()}`;
        if (!keyToRow.has(k)) keyToRow.set(k, r);
      }
      const rows = Array.from(keyToRow.values());

      // Use upsert on the unique constraint columns so we never hard-fail if a row already exists.
      const { data, error } = await sb
        .from('curriculum_topics')
        .upsert(rows, { onConflict: 'exam_board_subject_id,topic_name,topic_level' })
        .select('id,topic_code');
      if (error) throw new Error(error.message);
      (data || []).forEach((row: any) => {
        if (row?.id && row?.topic_code) prodIdByCode.set(row.topic_code, row.id);
      });
    });

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
    // Staging id->code map for parent linking
    const stgCodeById = new Map<string, string>();
    stgTopics.forEach((t) => stgCodeById.set(t.id, t.topic_code));

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
      note: 'Embeddings regeneration is intentionally not wired to this button yet (next step).',
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

