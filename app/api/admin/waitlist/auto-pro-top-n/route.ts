import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../../lib/server/adminApi';

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const body = await request.json().catch(() => ({}));
    const enabled = Boolean(body?.enabled);
    const daysRaw = Number(body?.days);
    const topNRaw = Number(body?.topN);

    const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(3650, Math.floor(daysRaw))) : 365;
    const topN = Number.isFinite(topNRaw) ? Math.max(1, Math.min(500, Math.floor(topNRaw))) : 50;

    const supabase = getServiceClient();
    const { error } = await supabase
      .from('waitlist')
      .update({
        auto_pro_enabled: enabled,
        auto_pro_days: days,
      })
      .lte('position', topN);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, topN, enabled, days });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

