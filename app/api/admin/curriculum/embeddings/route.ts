import { NextRequest, NextResponse } from 'next/server';
import { parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

type Body = {
  exam_board_subject_id: string;
  delete_first?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const token = parseBearerToken(req.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const body = (await req.json().catch(() => ({}))) as Body;
    const exam_board_subject_id = String(body.exam_board_subject_id || '').trim();
    if (!exam_board_subject_id) return NextResponse.json({ error: 'Missing exam_board_subject_id' }, { status: 400 });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const opsSecret = process.env.CURRICULUM_OPS_SECRET;
    if (!supabaseUrl) return NextResponse.json({ error: 'Missing SUPABASE_URL' }, { status: 500 });
    if (!serviceKey) return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    if (!opsSecret) return NextResponse.json({ error: 'Missing CURRICULUM_OPS_SECRET' }, { status: 500 });

    const fnUrl = `${supabaseUrl}/functions/v1/rebuild-subject-embeddings`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'content-type': 'application/json',
        'x-curriculum-ops-secret': opsSecret,
      },
      body: JSON.stringify({
        exam_board_subject_id,
        delete_first: body.delete_first !== false,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: json?.error || `Edge function failed (${res.status})`, details: json }, { status: 500 });
    }

    return NextResponse.json(json);
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

