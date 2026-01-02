import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

type EnvMode = 'production' | 'staging';

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const url = new URL(request.url);
    const env = (url.searchParams.get('env') || 'production').toLowerCase() as EnvMode;
    const subjectId = (url.searchParams.get('subjectId') || '').trim();
    if (!subjectId) return NextResponse.json({ error: 'Missing subjectId' }, { status: 400 });

    const sb = getServiceClient();

    if (env === 'staging') {
      // NOTE: staging subjectId is staging_aqa_subjects.id
      const { data, error } = await sb
        .from('staging_aqa_topics')
        .select('id,topic_code,topic_name,topic_level,parent_topic_id')
        .eq('subject_id', subjectId)
        .order('topic_level')
        .order('topic_code');
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ rows: data || [] });
    }

    // production: subjectId is exam_board_subjects.id
    const { data, error } = await sb
      .from('curriculum_topics')
      .select('id,topic_code,topic_name,display_name,topic_level,parent_topic_id,sort_order')
      .eq('exam_board_subject_id', subjectId)
      .order('topic_level')
      .order('sort_order')
      .order('topic_code');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

