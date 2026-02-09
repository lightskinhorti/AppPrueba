'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Customer {
  id: string;
  stripe_customer_id: string;
  email: string | null;
  name: string | null;
  subscription_status: string | null;
  current_mrr_cents: number;
  lifetime_value_cents: number;
  plan_name: string | null;
  created_at_stripe: string;
  first_subscription_at: string | null;
  churned_at: string | null;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: string | null }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trialing: 'bg-blue-100 text-blue-700',
    past_due: 'bg-yellow-100 text-yellow-700',
    canceled: 'bg-red-100 text-red-700',
    unpaid: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        colors[status || ''] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status || 'unknown'}
    </span>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'mrr' | 'created' | 'name'>('mrr');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('synced_customers')
      .select('*')
      .order('current_mrr_cents', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (data) setCustomers(data);
        setLoading(false);
      });
  }, []);

  const filtered = customers
    .filter((c) => {
      if (statusFilter !== 'all' && c.subscription_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.email?.toLowerCase().includes(q) ||
          c.name?.toLowerCase().includes(q) ||
          c.stripe_customer_id.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'mrr') return b.current_mrr_cents - a.current_mrr_cents;
      if (sortBy === 'created')
        return new Date(b.created_at_stripe).getTime() - new Date(a.created_at_stripe).getTime();
      return (a.name || '').localeCompare(b.name || '');
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customers</h1>

      <div className="bg-white rounded-lg border border-gray-200">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Canceled</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="mrr">Sort by MRR</option>
            <option value="created">Sort by created</option>
            <option value="name">Sort by name</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Plan</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">MRR</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">LTV</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    {customers.length === 0
                      ? 'No customers found. Sync your Stripe data first.'
                      : 'No customers match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer.name || customer.email || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{customer.email || customer.stripe_customer_id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={customer.subscription_status} />
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {customer.plan_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(customer.current_mrr_cents)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatCurrency(customer.lifetime_value_cents)}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {customer.first_subscription_at
                        ? format(new Date(customer.first_subscription_at), 'MMM d, yyyy')
                        : format(new Date(customer.created_at_stripe), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
            Showing {filtered.length} of {customers.length} customers
          </div>
        )}
      </div>
    </div>
  );
}
