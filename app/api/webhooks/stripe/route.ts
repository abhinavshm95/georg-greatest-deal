import Stripe from 'stripe';
import { stripe } from '@/utils/stripe';
import {
  upsertProductRecord,
  upsertPriceRecord,
  manageSubscriptionStatusChange
} from '@/utils/supabase-admin';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Define webhook events that we handle
const RELEVANT_EVENTS = new Set([
  'product.created',
  'product.updated',
  'price.created',
  'price.updated',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

// Custom error class for webhook errors
class WebhookError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

// Structured logging function
const logWebhookEvent = (event: string, data: any, level: 'info' | 'error' | 'warn' = 'info') => {
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    event,
    data: typeof data === 'object' ? JSON.stringify(data) : data
  };
  
  if (level === 'error') {
    console.error('Webhook Error:', logData);
  } else if (level === 'warn') {
    console.warn('Webhook Warning:', logData);
  } else {
    console.log('Webhook Info:', logData);
  }
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Validate webhook secret
  if (!webhookSecret) {
    logWebhookEvent('webhook_secret_missing', 'STRIPE_WEBHOOK_SECRET not configured', 'error');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Validate signature header
  if (!signature) {
    logWebhookEvent('webhook_signature_missing', 'No Stripe signature found', 'error');
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logWebhookEvent('webhook_verified', { eventId: event.id, eventType: event.type });
  } catch (err) {
    const error = err as Error;
    logWebhookEvent('webhook_signature_verification_failed', {
      error: error.message,
      signature: signature.substring(0, 20) + '...'
    }, 'error');
    
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Check if this is an event we handle
  if (!RELEVANT_EVENTS.has(event.type)) {
    logWebhookEvent('webhook_event_ignored', { eventType: event.type }, 'info');
    return NextResponse.json({ received: true });
  }

  try {
    logWebhookEvent('webhook_processing_started', { eventId: event.id, eventType: event.type });

    switch (event.type) {
      case 'product.created':
      case 'product.updated':
        await upsertProductRecord(event.data.object as Stripe.Product);
        logWebhookEvent('product_processed', { 
          eventType: event.type, 
          productId: (event.data.object as Stripe.Product).id 
        });
        break;

      case 'price.created':
      case 'price.updated':
        await upsertPriceRecord(event.data.object as Stripe.Price);
        logWebhookEvent('price_processed', { 
          eventType: event.type, 
          priceId: (event.data.object as Stripe.Price).id 
        });
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await manageSubscriptionStatusChange(
          subscription.id,
          subscription.customer as string,
          event.type === 'customer.subscription.created'
        );
        logWebhookEvent('subscription_processed', { 
          eventType: event.type, 
          subscriptionId: subscription.id,
          customerId: subscription.customer as string
        });
        break;

      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        
        // Only handle subscription checkouts
        if (checkoutSession.mode === 'subscription') {
          const subscriptionId = checkoutSession.subscription;
          if (subscriptionId && checkoutSession.customer) {
            await manageSubscriptionStatusChange(
              subscriptionId as string,
              checkoutSession.customer as string,
              true
            );
            logWebhookEvent('checkout_subscription_processed', { 
              subscriptionId: subscriptionId as string,
              customerId: checkoutSession.customer as string
            });
          } else {
            logWebhookEvent('checkout_missing_data', { 
              subscriptionId, 
              customerId: checkoutSession.customer 
            }, 'warn');
          }
        } else {
          logWebhookEvent('checkout_non_subscription_ignored', { 
            mode: checkoutSession.mode 
          }, 'info');
        }
        break;

      default:
        // This should never happen due to RELEVANT_EVENTS check, but good to have
        logWebhookEvent('unhandled_event', { eventType: event.type }, 'warn');
        throw new WebhookError(`Unhandled event type: ${event.type}`, 400);
    }

    logWebhookEvent('webhook_processing_completed', { eventId: event.id, eventType: event.type });
    
    return NextResponse.json(
      { received: true },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    const webhookError = error as WebhookError | Error;
    
    logWebhookEvent('webhook_processing_failed', {
      eventId: event.id,
      eventType: event.type,
      error: webhookError.message,
      stack: webhookError.stack
    }, 'error');

    // Return appropriate error response
    const statusCode = webhookError instanceof WebhookError ? webhookError.statusCode : 500;
    const errorMessage = webhookError instanceof WebhookError ? webhookError.message : 'Internal server error';

    return NextResponse.json(
      { 
        error: errorMessage,
        eventId: event.id 
      },
      { status: statusCode }
    );
  }
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
