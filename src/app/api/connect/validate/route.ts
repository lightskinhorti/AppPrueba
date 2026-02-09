import { NextResponse } from 'next/server';
import { createUserStripeClient } from '@/lib/stripe/user-client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey } = (await request.json()) as { apiKey: string };

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    // Validate the key by making a test request
    const userStripe = createUserStripeClient(apiKey);

    // Check account info
    const account = await userStripe.accounts.retrieve('');

    // Count customers to show the user
    const customers = await userStripe.customers.list({ limit: 1 });

    return NextResponse.json({
      valid: true,
      accountName: account.settings?.dashboard?.display_name || account.business_profile?.name || 'Stripe Account',
      hasCustomers: (customers.data?.length || 0) > 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid API key';
    return NextResponse.json(
      { valid: false, error: message },
      { status: 400 }
    );
  }
}
