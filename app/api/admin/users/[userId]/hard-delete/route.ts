import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, parseBearerToken, requireAdminFromBearerToken } from '../../../../../../lib/server/adminApi';

// Best-effort cleanup: extend this list as your schema grows.
const USER_ID_TABLES = [
  'user_subscriptions',
  // Many projects store profile rows in public.users with primary key = auth.users.id (column name is often `id`)
  // We handle that table separately below because it typically doesn't have a `user_id` column.
  'user_subjects',
  'user_topic_priorities',
  'topic_study_preferences',
  'user_custom_topics',
  'user_discovered_topics',
  'user_stats',
  'flashcards',
  'card_reviews',
  'study_sessions',
  'daily_study_cards',
  'paper_progress',
  'student_attempts',
  'paper_xp_awards',
  'paper_question_xp_awards',
];

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    await requireAdminFromBearerToken(token);

    const userId = params.userId;
    const supabase = getServiceClient();

    // Attempt to delete app-owned rows first to reduce orphan risk.
    const deleteErrors: Array<{ table: string; error: string }> = [];
    for (const table of USER_ID_TABLES) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error) {
        // Many tables may not exist (or may use different key names). Collect errors and continue.
        deleteErrors.push({ table, error: error.message });
      }
    }

    // Delete profile row (public.users) if your schema uses it.
    // In your DB, public.users has primary key `id` (not `user_id`).
    {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) deleteErrors.push({ table: 'users', error: error.message });
    }

    // Finally delete the auth user (this will cascade for any tables with FK ON DELETE CASCADE).
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
    if (authErr) return NextResponse.json({ error: authErr.message, deleteErrors }, { status: 500 });

    return NextResponse.json({ ok: true, deleteErrors });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}



