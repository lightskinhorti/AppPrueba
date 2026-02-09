'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Grid3X3,
  UserMinus,
  Link2,
  Settings,
  CreditCard,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'MRR / Revenue', href: '/dashboard/mrr', icon: TrendingUp },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Cohort Retention', href: '/dashboard/cohorts', icon: Grid3X3, tier: 'growth' as const },
  { name: 'Churn Analysis', href: '/dashboard/churn', icon: UserMinus, tier: 'growth' as const },
];

const secondaryNav = [
  { name: 'Connect Stripe', href: '/dashboard/connect', icon: Link2 },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  tier: string;
}

export function Sidebar({ tier }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">ChurnLens</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Analytics
        </p>
        {navigation.map((item) => {
          const locked = item.tier && tier === 'starter';
          return (
            <Link
              key={item.name}
              href={locked ? '/dashboard/billing' : item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                locked && 'opacity-50'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
              {locked && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {item.tier}+
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Settings
          </p>
          {secondaryNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            tier === 'pro' ? 'bg-purple-100 text-purple-700' :
            tier === 'growth' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          )}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
          </span>
        </div>
      </div>
    </aside>
  );
}
