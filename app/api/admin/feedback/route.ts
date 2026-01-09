import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../lib/server/adminApi';

function norm(s: any): string {
  return String(s || '').trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const url = new URL(request.url);
    const q = norm(url.searchParams.get('q') || '');
    const surveyKey = String(url.searchParams.get('survey_key') || '').trim();
    const status = String(url.searchParams.get('status') || '').trim();
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);

    const supabase = getServiceClient();

    let query = supabase
      .from('app_feedback')
      .select('id,created_at,survey_key,status,user_id,answers,meta', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (surveyKey) query = query.eq('survey_key', surveyKey);
    if (status) query = query.eq('status', status);

    // Best-effort search by participant name/email from answers JSON.
    // If the PostgREST JSON path filter isn't available, we'll fall back to no search.
    if (q) {
      try {
        query = query.or(`answers->>participant_email.ilike.%${q}%,answers->>participant_name.ilike.%${q}%`);
      } catch {
        // ignore
      }
    }

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data || []) as any[];
    return NextResponse.json({
      rows,
      count: typeof count === 'number' ? count : null,
      limit,
      offset,
      hasMore: typeof count === 'number' ? offset + limit < count : rows.length === limit,
    });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

