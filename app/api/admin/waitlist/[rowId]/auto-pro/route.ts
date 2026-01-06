import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../lib/server/adminApi';

export async function POST(request: NextRequest, ctx: { params: { rowId: string } }) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const rowId = String(ctx?.params?.rowId || '').trim();
    if (!rowId) return NextResponse.json({ error: 'Missing rowId' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const enabled = Boolean(body?.enabled);
    const daysRaw = Number(body?.days);
    const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(3650, Math.floor(daysRaw))) : 365;

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('waitlist')
      .update({
        auto_pro_enabled: enabled,
        auto_pro_days: days,
      })
      .eq('id', rowId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, row: data });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

