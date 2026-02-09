import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTierFromPriceId, getCustomerLimitForTier } from '@/lib/stripe/plans';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        // Get subscription details
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const priceId = subscription.items.data[0]?.price?.id;
          const tier = priceId ? getTierFromPriceId(priceId) : 'starter';

          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: session.customer as string,
              subscription_id: subscription.id,
              subscription_status: 'active',
              subscription_tier: tier,
              customer_limit: getCustomerLimitForTier(tier),
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;

        const priceId = subscription.items.data[0]?.price?.id;
        const tier = priceId ? getTierFromPriceId(priceId) : 'starter';

        await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status === 'active' ? 'active' :
              subscription.status === 'past_due' ? 'past_due' :
              subscription.status === 'canceled' ? 'canceled' : subscription.status,
            subscription_tier: tier,
            customer_limit: getCustomerLimitForTier(tier),
            subscription_id: subscription.id,
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            subscription_tier: 'starter',
            customer_limit: 200,
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'active' })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
