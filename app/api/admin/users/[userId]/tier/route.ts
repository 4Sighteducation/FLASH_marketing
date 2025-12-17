import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../../lib/server/adminApi';

const ALLOWED_TIERS = new Set(['free', 'premium', 'pro', 'lite', 'full']);

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const { tier, expires_at } = await request.json();
    const normalizedTier = typeof tier === 'string' ? tier.toLowerCase() : '';
    if (!ALLOWED_TIERS.has(normalizedTier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const userId = params.userId;
    const expires = expires_at ? new Date(expires_at).toISOString() : null;

    const supabase = getServiceClient();
    const { error } = await supabase.from('user_subscriptions').upsert({
      user_id: userId,
      tier: normalizedTier,
      expires_at: expires,
      updated_at: new Date().toISOString(),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}



