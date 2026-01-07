import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

function clampText(v: any, maxLen: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, maxLen);
}

export async function PATCH(request: NextRequest, { params }: { params: { codeId: string } }) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const codeId = String(params.codeId || '');
    if (!codeId) return NextResponse.json({ error: 'Missing codeId' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const assigned_to = clampText(body?.assigned_to, 120);
    const assigned_note = clampText(body?.assigned_note, 400);
    const cancel = !!body?.cancel;
    const cancelled_note = clampText(body?.cancelled_note, 200);

    const supabase = getServiceClient();

    const patch: any = {
      assigned_to,
      assigned_note,
    };

    // Assign timestamp: if assigning to someone and timestamp is missing, stamp it.
    if (assigned_to) patch.assigned_at = new Date().toISOString();
    if (!assigned_to) patch.assigned_at = null;

    if (cancel) {
      patch.cancelled_at = new Date().toISOString();
      patch.cancelled_note = cancelled_note;
      patch.expires_at = new Date().toISOString(); // immediate expiry = cancelled
    }

    const { error } = await supabase.from('access_codes').update(patch).eq('id', codeId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { codeId: string } }) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const codeId = String(params.codeId || '');
    if (!codeId) return NextResponse.json({ error: 'Missing codeId' }, { status: 400 });

    const supabase = getServiceClient();

    // Only allow deletion if unused (preserve redemption history).
    const { data: codeRow, error: codeErr } = await supabase
      .from('access_codes')
      .select('id,uses_count')
      .eq('id', codeId)
      .maybeSingle();
    if (codeErr) return NextResponse.json({ error: codeErr.message }, { status: 500 });
    if (!codeRow?.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const uses = Number((codeRow as any).uses_count || 0);
    if (uses > 0) return NextResponse.json({ error: 'Cannot delete: code has been used.' }, { status: 400 });

    const { count: redCount, error: redErr } = await supabase
      .from('access_code_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('code_id', codeId);
    if (redErr) return NextResponse.json({ error: redErr.message }, { status: 500 });
    if ((redCount || 0) > 0) return NextResponse.json({ error: 'Cannot delete: redemption history exists.' }, { status: 400 });

    const { error } = await supabase.from('access_codes').delete().eq('id', codeId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

