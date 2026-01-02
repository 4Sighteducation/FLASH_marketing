import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

type EnvMode = 'production' | 'staging';

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

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const url = new URL(request.url);
    const env = (url.searchParams.get('env') || 'production').toLowerCase() as EnvMode;
    const board = (url.searchParams.get('board') || '').trim().toUpperCase();
    const qual = (url.searchParams.get('qual') || '').trim().toUpperCase();
    if (!board || !qual) {
      return NextResponse.json({ error: 'Missing board or qual' }, { status: 400 });
    }

    const sb = getServiceClient();

    if (env === 'staging') {
      const stagingQual = mapQualToStaging(qual);
      const { data: subjects, error } = await sb
        .from('staging_aqa_subjects')
        .select('id,subject_code,subject_name,qualification_type,exam_board')
        .eq('exam_board', board)
        .eq('qualification_type', stagingQual)
        .order('subject_name');

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ rows: subjects || [] });
    }

    // production
    const { data: eb, error: ebErr } = await sb.from('exam_boards').select('id,code').eq('code', board).maybeSingle();
    if (ebErr) return NextResponse.json({ error: ebErr.message }, { status: 500 });
    if (!eb?.id) return NextResponse.json({ rows: [] });

    const { data: qt, error: qtErr } = await sb.from('qualification_types').select('id,code').eq('code', qual).maybeSingle();
    if (qtErr) return NextResponse.json({ error: qtErr.message }, { status: 500 });
    if (!qt?.id) return NextResponse.json({ rows: [] });

    const { data: subjects, error } = await sb
      .from('exam_board_subjects')
      .select('id,subject_code,subject_name,is_current')
      .eq('exam_board_id', eb.id)
      .eq('qualification_type_id', qt.id)
      .eq('is_current', true)
      .order('subject_name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rows: subjects || [] });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

