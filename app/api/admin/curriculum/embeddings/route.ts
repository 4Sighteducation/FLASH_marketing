import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

type Body = {
  exam_board_subject_id: string;
  delete_first?: boolean;
};

export async function POST(req: NextRequest) {
  let runId: string | undefined;
  try {
    const startedAtMs = Date.now();
    const token = parseBearerToken(req.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    const adminUser = await requireAdminFromBearerToken(token);

    const body = (await req.json().catch(() => ({}))) as Body;
    const exam_board_subject_id = String(body.exam_board_subject_id || '').trim();
    if (!exam_board_subject_id) return NextResponse.json({ error: 'Missing exam_board_subject_id' }, { status: 400 });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const opsSecret = process.env.CURRICULUM_OPS_SECRET;
    if (!supabaseUrl) return NextResponse.json({ error: 'Missing SUPABASE_URL' }, { status: 500 });
    if (!serviceKey) return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    if (!opsSecret) return NextResponse.json({ error: 'Missing CURRICULUM_OPS_SECRET' }, { status: 500 });

    // Resolve subject for nice log context + use canonical subjectCode for filtering
    const sb = getServiceClient();
    const { data: subj, error: subjErr } = await sb
      .from('exam_board_subjects')
      .select('subject_code,exam_board:exam_boards(code),qual:qualification_types(code)')
      .eq('id', exam_board_subject_id)
      .maybeSingle();
    if (subjErr) return NextResponse.json({ error: subjErr.message }, { status: 500 });

    const subjectCode = String(subj?.subject_code || '').toUpperCase() || null;
    const boardCodeRaw = Array.isArray(subj?.exam_board) ? subj.exam_board?.[0]?.code : (subj as any)?.exam_board?.code;
    const qualCodeRaw = Array.isArray(subj?.qual) ? subj.qual?.[0]?.code : (subj as any)?.qual?.code;
    const board = boardCodeRaw ? String(boardCodeRaw).toUpperCase() : null;
    const qual = qualCodeRaw ? String(qualCodeRaw).toUpperCase() : null;

    const { data: runRow, error: runErr } = await sb
      .from('curriculum_ops_runs')
      .insert({
        action: 'rebuild_embeddings',
        status: 'running',
        exam_board: board,
        qualification_level: qual,
        subject_code: subjectCode,
        production_subject_id: exam_board_subject_id,
        requested_by_email: adminUser.email,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();
    if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });
    runId = runRow?.id as string | undefined;

    // Confidence telemetry we can compute from DB even if the edge function returns minimal payload
    const { count: topicsTotal, error: tCntErr } = await sb
      .from('curriculum_topics')
      .select('id', { count: 'exact', head: true })
      .eq('exam_board_subject_id', exam_board_subject_id);
    if (tCntErr) return NextResponse.json({ error: tCntErr.message }, { status: 500 });

    const { data: topicIds, error: idsErr } = await sb
      .from('curriculum_topics')
      .select('id')
      .eq('exam_board_subject_id', exam_board_subject_id);
    if (idsErr) return NextResponse.json({ error: idsErr.message }, { status: 500 });
    const ids = (topicIds || []).map((r: any) => r.id).filter(Boolean);

    let metadataBefore = 0;
    for (let i = 0; i < ids.length; i += 1000) {
      const chunk = ids.slice(i, i + 1000);
      const { count, error } = await sb.from('topic_ai_metadata').select('topic_id', { count: 'exact', head: true }).in('topic_id', chunk);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      metadataBefore += count || 0;
    }

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
        run_id: runId,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (runId) {
        await sb
          .from('curriculum_ops_runs')
          .update({ status: 'error', finished_at: new Date().toISOString(), error_text: json?.error || `Edge function failed (${res.status})`, summary_json: json })
          .eq('id', runId);
      }
      return NextResponse.json({ error: json?.error || `Edge function failed (${res.status})`, details: json }, { status: 500 });
    }

    // Compute post-run coverage regardless of edge payload
    let metadataAfter = 0;
    for (let i = 0; i < ids.length; i += 1000) {
      const chunk = ids.slice(i, i + 1000);
      const { count, error } = await sb.from('topic_ai_metadata').select('topic_id', { count: 'exact', head: true }).in('topic_id', chunk);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      metadataAfter += count || 0;
    }

    const durationMs = Date.now() - startedAtMs;
    const merged = {
      ...(json || {}),
      duration_ms: typeof (json as any)?.duration_ms === 'number' ? (json as any).duration_ms : durationMs,
      existing_metadata_rows_before:
        typeof (json as any)?.existing_metadata_rows_before === 'number' ? (json as any).existing_metadata_rows_before : metadataBefore,
      metadata_rows_after: typeof (json as any)?.metadata_rows_after === 'number' ? (json as any).metadata_rows_after : metadataAfter,
      total_topics: typeof (json as any)?.total_topics === 'number' ? (json as any).total_topics : topicsTotal || ids.length,
      // model/batch info may not be available if function is old; keep null so UI can show '—'
      model: (json as any)?.model || null,
      batch_size: (json as any)?.batch_size ?? null,
      batches: (json as any)?.batches ?? null,
    };

    if (runId) {
      await sb
        .from('curriculum_ops_runs')
        .update({ status: 'success', finished_at: new Date().toISOString(), summary_json: merged })
        .eq('id', runId);
    }
    return NextResponse.json(merged);
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    try {
      if (runId) {
        const sb2 = getServiceClient();
        await sb2.from('curriculum_ops_runs').update({ status: 'error', finished_at: new Date().toISOString(), error_text: msg }).eq('id', runId);
      }
    } catch {
      // ignore
    }
    const status = msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

