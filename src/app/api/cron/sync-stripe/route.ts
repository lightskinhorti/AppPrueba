import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncStripeData } from '@/lib/sync/stripe-ingester';
import { computeMrrSnapshots } from '@/lib/analytics/mrr';
import { computeCohortSnapshots } from '@/lib/analytics/cohorts';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all valid stripe connections
  const { data: connections, error } = await supabase
    .from('stripe_connections')
    .select('user_id, stripe_api_key_encrypted, last_sync_at')
    .eq('is_valid', true);

  if (error || !connections) {
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }

  const results = [];

  for (const conn of connections) {
    try {
      const syncResult = await syncStripeData(
        conn.user_id,
        conn.stripe_api_key_encrypted,
        false,
        conn.last_sync_at
      );

      if (!syncResult.error) {
        await computeMrrSnapshots(conn.user_id);
        await computeCohortSnapshots(conn.user_id);
      }

      results.push({
        userId: conn.user_id,
        success: !syncResult.error,
        ...syncResult,
      });
    } catch (err) {
      results.push({
        userId: conn.user_id,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    synced: results.length,
    results,
  });
}
