import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

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

function norm(s: unknown): string {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

type TopicRow = { topic_code: string | null; topic_name?: string | null; topic_level?: number | null };

function countsByLevel(rows: TopicRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = String(r.topic_level ?? 'null');
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const url = new URL(request.url);
    const board = (url.searchParams.get('board') || '').trim().toUpperCase();
    const qual = (url.searchParams.get('qual') || '').trim().toUpperCase();
    const subjectCode = (url.searchParams.get('subjectCode') || '').trim().toUpperCase();
    if (!board || !qual || !subjectCode) return NextResponse.json({ error: 'Missing board/qual/subjectCode' }, { status: 400 });

    const sb = getServiceClient();

    // resolve production subject
    const { data: eb } = await sb.from('exam_boards').select('id,code').eq('code', board).maybeSingle();
    const { data: qt } = await sb.from('qualification_types').select('id,code').eq('code', qual).maybeSingle();
    if (!eb?.id || !qt?.id) return NextResponse.json({ error: 'Unknown board/qualification' }, { status: 400 });

    const { data: prodSub } = await sb
      .from('exam_board_subjects')
      .select('id,subject_code,subject_name,is_current')
      .eq('exam_board_id', eb.id)
      .eq('qualification_type_id', qt.id)
      .eq('subject_code', subjectCode)
      .eq('is_current', true)
      .maybeSingle();

    // resolve staging subject
    const stgQual = mapQualToStaging(qual);
    const { data: stgSub } = await sb
      .from('staging_aqa_subjects')
      .select('id,subject_code,subject_name')
      .eq('exam_board', board)
      .eq('qualification_type', stgQual)
      .eq('subject_code', subjectCode)
      .maybeSingle();

    if (!prodSub?.id || !stgSub?.id) {
      return NextResponse.json({
        production: prodSub || null,
        staging: stgSub || null,
        diff: null,
        error: 'Missing subject in production or staging',
      });
    }

    const { data: prodTopicsRaw, error: prodErr } = await sb
      .from('curriculum_topics')
      .select('topic_code,topic_name,topic_level')
      .eq('exam_board_subject_id', prodSub.id);
    if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 500 });

    const { data: stgTopicsRaw, error: stgErr } = await sb
      .from('staging_aqa_topics')
      .select('topic_code,topic_name,topic_level')
      .eq('subject_id', stgSub.id);
    if (stgErr) return NextResponse.json({ error: stgErr.message }, { status: 500 });

    const prodTopics = (prodTopicsRaw || []) as TopicRow[];
    const stgTopics = (stgTopicsRaw || []) as TopicRow[];

    const prodCodes = new Set(prodTopics.map((t) => t.topic_code).filter(Boolean) as string[]);
    const stgCodes = new Set(stgTopics.map((t) => t.topic_code).filter(Boolean) as string[]);

    const missingInProd = Array.from(stgCodes).filter((c) => !prodCodes.has(c)).sort();
    const missingInStg = Array.from(prodCodes).filter((c) => !stgCodes.has(c)).sort();

    const prodByCode = new Map(prodTopics.map((t) => [t.topic_code || '', t]));
    const stgByCode = new Map(stgTopics.map((t) => [t.topic_code || '', t]));
    const nameDiffs: Array<{ code: string; prod: string; stg: string }> = [];
    for (const code of Array.from(prodCodes)) {
      const p = prodByCode.get(code);
      const s = stgByCode.get(code);
      if (!p || !s) continue;
      const pn = norm(p.topic_name);
      const sn = norm(s.topic_name);
      if (pn !== sn) nameDiffs.push({ code, prod: pn, stg: sn });
    }

    return NextResponse.json({
      production: prodSub,
      staging: stgSub,
      diff: {
        prodTopics: prodTopics.length,
        stgTopics: stgTopics.length,
        missingInProd,
        missingInStg,
        nameDiffs,
        countsByLevel: {
          production: countsByLevel(prodTopics),
          staging: countsByLevel(stgTopics),
        },
      },
    });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

