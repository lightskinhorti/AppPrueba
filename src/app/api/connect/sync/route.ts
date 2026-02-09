import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncStripeData } from '@/lib/sync/stripe-ingester';
import { computeMrrSnapshots } from '@/lib/analytics/mrr';
import { computeCohortSnapshots } from '@/lib/analytics/cohorts';
import { SYNC_COOLDOWN_MS } from '@/lib/utils/constants';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey, fullSync } = (await request.json()) as {
      apiKey?: string;
      fullSync?: boolean;
    };

    const adminClient = createAdminClient();

    // Get existing connection
    const { data: connection } = await adminClient
      .from('stripe_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If providing a new API key, store it
    if (apiKey) {
      const encryptionKey = process.env.ENCRYPTION_KEY!;

      await adminClient.rpc('upsert_stripe_connection', {
        p_user_id: user.id,
        p_api_key: apiKey,
        p_encryption_key: encryptionKey,
      }).then(async (result) => {
        if (result.error) {
          // Fallback: store directly (less secure, for MVP)
          await adminClient
            .from('stripe_connections')
            .upsert(
              {
                user_id: user.id,
                stripe_api_key_encrypted: apiKey, // TODO: encrypt properly
                last_sync_status: 'pending',
              },
              { onConflict: 'user_id' }
            );
        }
      });
    }

    // Check cooldown
    if (connection?.last_sync_at && !fullSync) {
      const lastSync = new Date(connection.last_sync_at).getTime();
      if (Date.now() - lastSync < SYNC_COOLDOWN_MS) {
        return NextResponse.json(
          { error: 'Sync cooldown active. Try again later.' },
          { status: 429 }
        );
      }
    }

    // Get the API key to use
    const keyToUse = apiKey || connection?.stripe_api_key_encrypted;
    if (!keyToUse) {
      return NextResponse.json(
        { error: 'No Stripe connection found' },
        { status: 400 }
      );
    }

    // Run sync
    const result = await syncStripeData(
      user.id,
      keyToUse,
      fullSync || !connection?.last_sync_at,
      connection?.last_sync_at
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Compute analytics after sync
    await computeMrrSnapshots(user.id);
    await computeCohortSnapshots(user.id);

    return NextResponse.json({
      success: true,
      synced: {
        customers: result.customers,
        subscriptions: result.subscriptions,
        events: result.events,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
