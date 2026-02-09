# ChurnLens

Subscription analytics for small SaaS teams. Connect your Stripe account and get MRR tracking, cohort retention analysis, and churn intelligence.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL, Auth, Storage)
- **Payments:** Stripe (Billing, Checkout, Customer Portal, Webhooks)
- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Features

- **MRR/ARR Dashboard:** Automatic calculation with movement breakdown (new, expansion, contraction, churned)
- **Cohort Retention:** Visual heatmap showing monthly cohort retention over time
- **Churn Analysis:** Customer and revenue churn rate tracking with trend visualization
- **Customer Intelligence:** Searchable list with MRR, LTV, status, and churn risk
- **Stripe Billing:** Three-tier subscription (Starter $19, Growth $49, Pro $99)
- **Data Sync:** Automated Stripe data ingestion with rate limiting and incremental sync

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your credentials
3. Install dependencies: `npm install`
4. Run Supabase migrations from `supabase/migrations/`
5. Create Stripe products/prices matching the tier configuration
6. Run the dev server: `npm run dev`

> **Ready to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for a full step-by-step guide using free tiers (Vercel + Supabase + Stripe).

## Project Structure

```
src/
  app/
    (auth)/          # Login, signup pages
    (dashboard)/     # Dashboard pages (overview, MRR, cohorts, churn, customers, billing, settings, connect)
    api/             # API routes (Stripe webhook, checkout, portal, connect, analytics, cron)
    auth/            # Auth callback
  lib/
    analytics/       # MRR computation, cohort analysis, churn metrics
    stripe/          # Stripe client, plan config, user client factory
    supabase/        # Browser, server, and admin Supabase clients
    sync/            # Stripe data ingestion pipeline, rate limiter, transforms
    utils/           # Constants, tier gating, classname utility
  components/
    charts/          # KPI cards, MRR chart, MRR movement chart, cohort table
    dashboard/       # Sidebar, header
supabase/
  migrations/        # PostgreSQL schema (profiles, stripe_connections, synced data, analytics, RLS)
```
