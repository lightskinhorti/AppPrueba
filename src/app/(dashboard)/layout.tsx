import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import type { Tier } from '@/lib/utils/constants';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, email')
    .eq('id', user.id)
    .single();

  const tier = (profile?.subscription_tier || 'starter') as Tier;
  const email = profile?.email || user.email || '';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar tier={tier} />
      <div className="flex-1 flex flex-col">
        <Header email={email} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
