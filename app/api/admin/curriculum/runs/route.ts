import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

export async function GET(req: NextRequest) {
  try {
    const token = parseBearerToken(req.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const { searchParams } = new URL(req.url);
    const subjectCode = (searchParams.get('subjectCode') || '').trim().toUpperCase();
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || 50)));

    const sb = getServiceClient();
    let q = sb
      .from('curriculum_ops_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (subjectCode) q = q.eq('subject_code', subjectCode);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

