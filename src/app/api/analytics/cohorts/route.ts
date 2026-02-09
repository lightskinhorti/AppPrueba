import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (profile?.subscription_tier === 'starter') {
      return NextResponse.json(
        { error: 'Upgrade to Growth or Pro to access cohort analysis' },
        { status: 403 }
      );
    }

    const { data: cohorts, error } = await supabase
      .from('cohort_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('cohort_month', { ascending: true })
      .order('months_since_start', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cohorts: cohorts || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load cohort data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
