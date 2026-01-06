import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../../lib/server/adminApi';

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!rawEmail || !rawEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const daysRaw = Number(body?.days);
    const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(3650, Math.floor(daysRaw))) : 365;
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 140) : '';
    const resolvedSource = note ? `admin:${note}` : 'admin_manual';

    const supabase = getServiceClient();

    // Determine next position (manual additions still get a position, but bypass public cap)
    const { count } = await supabase.from('waitlist').select('*', { count: 'exact', head: true });
    const position = (count || 0) + 1;

    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: rawEmail,
          position,
          // keep legacy flag for compatibility; manual testers should be eligible regardless of position
          is_top_twenty: false,
          auto_pro_enabled: true,
          auto_pro_days: days,
          source: resolvedSource,
          notified: false,
          created_at: new Date().toISOString(),
        },
      ])
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

