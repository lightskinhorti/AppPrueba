# Deployment Guide (Free Tier)

Complete guide to deploy ChurnLens for **$0/month** using free tiers of Vercel, Supabase, and Stripe.

## Cost Breakdown

| Service | Plan | Cost | What you get |
|---------|------|------|--------------|
| **Vercel** | Hobby (free) | $0 | Hosting, serverless functions, automatic deploys |
| **Supabase** | Free | $0 | 500 MB database, 50K monthly active users, auth |
| **Stripe** | Standard | $0 base | No monthly fee — only 2.9% + $0.30 per transaction |

> **Note:** Vercel's free tier does **not** include cron jobs. This guide covers a free workaround using cron-job.org or GitHub Actions.

---

## Prerequisites

- A [GitHub](https://github.com) account (repo already hosted here)
- A [Vercel](https://vercel.com) account (sign up with GitHub)
- A [Supabase](https://supabase.com) account
- A [Stripe](https://stripe.com) account

---

## Step 1: Set Up Supabase (Database + Auth)

### 1.1 Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name (e.g., `churnlens`), set a strong database password, and pick a region close to your users
4. Wait for the project to finish provisioning

### 1.2 Run database migrations

1. In the Supabase dashboard, go to **SQL Editor**
2. Run each migration file **in order**. Copy and paste the contents of each file:

   ```
   supabase/migrations/00001_create_profiles.sql
   supabase/migrations/00002_create_stripe_connections.sql
   supabase/migrations/00003_create_synced_data.sql
   supabase/migrations/00004_create_analytics_tables.sql
   supabase/migrations/00005_create_rls_policies.sql
   ```

   > Run them one at a time, in order. Each depends on the previous one.

### 1.3 Copy your credentials

Go to **Project Settings > API** and copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon (public) key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role (secret) key** → `SUPABASE_SERVICE_ROLE_KEY`

### 1.4 Enable authentication

1. Go to **Authentication > Providers**
2. Enable the providers you want (Email, Google, GitHub, etc.)
3. For OAuth providers, set the redirect URL to: `https://your-vercel-domain.vercel.app/auth/callback`

---

## Step 2: Set Up Stripe (Payments)

### 2.1 Create your account

1. Sign up at [stripe.com](https://stripe.com)
2. You can stay in **Test Mode** while setting things up (toggle in the top-right of the dashboard)

### 2.2 Create products and prices

1. Go to **Products** in the Stripe dashboard
2. Create 3 products with **monthly recurring** prices:

   | Product | Price | Price ID env var |
   |---------|-------|------------------|
   | Starter | $19/month | `STRIPE_PRICE_STARTER` |
   | Growth | $49/month | `STRIPE_PRICE_GROWTH` |
   | Pro | $99/month | `STRIPE_PRICE_PRO` |

3. After creating each price, copy its **Price ID** (starts with `price_`)

### 2.3 Get API keys

Go to **Developers > API Keys** and copy:

- **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Secret key** → `STRIPE_SECRET_KEY`

> Keep the webhook secret for after deployment (Step 4).

---

## Step 3: Deploy to Vercel

### 3.1 Import the project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** and select `lightskinhorti/AppPrueba`
3. Vercel will auto-detect it as a Next.js project

### 3.2 Configure environment variables

Before clicking **Deploy**, add all environment variables in the Vercel project settings:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...          # (add after Step 4.1)

# Stripe Price IDs
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_GROWTH=price_xxx
STRIPE_PRICE_PRO=price_xxx

# App
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
CRON_SECRET=generate-a-random-secret-here

# Encryption (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-64-char-hex-string
```

> To generate secure values:
> - `CRON_SECRET`: Run `openssl rand -hex 16` in your terminal
> - `ENCRYPTION_KEY`: Run `openssl rand -hex 32` in your terminal

### 3.3 Deploy

Click **Deploy** and wait for the build to finish. Vercel will give you a URL like `https://your-project.vercel.app`.

---

## Step 4: Post-Deployment Setup

### 4.1 Configure Stripe webhook

1. In the Stripe dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set the URL to: `https://your-project.vercel.app/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Go back to Vercel and add/update the `STRIPE_WEBHOOK_SECRET` environment variable
8. **Redeploy** for the new variable to take effect

### 4.2 Update Supabase auth redirect URL

In Supabase dashboard, go to **Authentication > URL Configuration** and add your production URL:

- **Site URL:** `https://your-project.vercel.app`
- **Redirect URLs:** `https://your-project.vercel.app/auth/callback`

### 4.3 Set up free cron job (Stripe data sync)

Vercel's free Hobby plan does **not** support cron jobs. Use one of these free alternatives:

#### Option A: cron-job.org (recommended — easiest)

1. Sign up at [cron-job.org](https://cron-job.org) (free)
2. Create a new cron job:
   - **URL:** `https://your-project.vercel.app/api/cron/sync-stripe`
   - **Schedule:** Every 6 hours (or your preferred interval)
   - **HTTP Method:** GET
   - **Headers:** Add a header `Authorization` with value `Bearer YOUR_CRON_SECRET` (use the same `CRON_SECRET` from your environment variables)
3. Save and enable

#### Option B: GitHub Actions (free for public repos)

Create `.github/workflows/cron-sync.yml` in your repo:

```yaml
name: Stripe Sync Cron
on:
  schedule:
    - cron: '0 */6 * * *'   # Every 6 hours
  workflow_dispatch:          # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Stripe sync
        run: |
          curl -X GET "https://your-project.vercel.app/api/cron/sync-stripe" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Then add `CRON_SECRET` as a repository secret in GitHub (**Settings > Secrets and variables > Actions**).

---

## Step 5: Verify Everything Works

### Checklist

- [ ] App loads at your Vercel URL
- [ ] Sign up / login works (Supabase auth)
- [ ] Stripe checkout redirects correctly (use test card `4242 4242 4242 4242`)
- [ ] Webhook events appear in Stripe dashboard (Developers > Webhooks > select endpoint > see recent events)
- [ ] Cron sync triggers successfully (check cron-job.org logs or GitHub Actions)
- [ ] Dashboard displays analytics after syncing data

### Test cards (Stripe test mode)

| Card number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication |
| `4000 0000 0000 0002` | Declined |

Use any future expiration date, any 3-digit CVC, and any ZIP code.

---

## Free Tier Limits to Keep in Mind

| Service | Limit | What happens |
|---------|-------|--------------|
| **Vercel Hobby** | 100 GB bandwidth/month, 10s function timeout, no cron | Sufficient for early-stage SaaS |
| **Supabase Free** | 500 MB database, 1 GB file storage, 2 GB bandwidth | Monitor at dashboard; upgrade when approaching limits |
| **Stripe** | No limits | Only charges 2.9% + $0.30 per successful transaction |
| **cron-job.org Free** | 1 min minimum interval, 3 cron jobs | More than enough for data sync |

---

## Going to Production

When you're ready to go live with real payments:

1. **Stripe:** Toggle off Test Mode in the Stripe dashboard
2. **API keys:** Replace all `sk_test_` / `pk_test_` keys with live keys (`sk_live_` / `pk_live_`) in Vercel env vars
3. **Webhook:** Create a new webhook endpoint with the live mode keys and update `STRIPE_WEBHOOK_SECRET`
4. **Price IDs:** Create live products/prices and update `STRIPE_PRICE_*` variables
5. **Redeploy** for all changes to take effect
6. **Custom domain (optional):** Add your own domain in Vercel project settings (free on Hobby plan)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Auth redirect fails | Check that your Vercel URL is in Supabase's allowed redirect URLs |
| Webhook returns 400 | Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe |
| Cron sync doesn't run | Check `CRON_SECRET` matches between your cron service and Vercel env vars |
| Build fails on Vercel | Run `npm run build` locally first to catch TypeScript/ESLint errors |
| Database errors | Ensure all 5 migrations ran in order; check Supabase SQL Editor for errors |
| `ENCRYPTION_KEY` error | Must be at least 32 characters; use `openssl rand -hex 32` to generate |
