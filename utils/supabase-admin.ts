import { toDateTime } from './helpers';
import { stripe } from './stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database } from 'types_db';

type Product = Database['public']['Tables']['products']['Row'];
type Price = Database['public']['Tables']['prices']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Insert'];

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
}

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Structured logging function
const logDatabaseOperation = (operation: string, data: any, level: 'info' | 'error' | 'warn' = 'info') => {
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    operation,
    data: typeof data === 'object' ? JSON.stringify(data) : data
  };
  
  if (level === 'error') {
    console.error('Database Error:', logData);
  } else if (level === 'warn') {
    console.warn('Database Warning:', logData);
  } else {
    console.log('Database Info:', logData);
  }
};

const upsertProductRecord = async (product: Stripe.Product): Promise<void> => {
  try {
    // Extract max_notification_limit from the product data
    // Since it's a custom field, we need to access it from the product object
    const maxNotificationLimit = (product as any).max_notification_limit || 
      (product.metadata?.max_notification_limit ? parseInt(product.metadata.max_notification_limit) : 5);

    const productData: Product = {
      id: product.id,
      active: product.active,
      name: product.name,
      description: product.description ?? null,
      image: product.images?.[0] ?? null,
      metadata: product.metadata,
      max_notification_limit: maxNotificationLimit
    };

    const { error } = await supabaseAdmin.from('products').upsert([productData]);
    
    if (error) {
      logDatabaseOperation('product_upsert_failed', { productId: product.id, error: error.message }, 'error');
      throw error;
    }
    
    logDatabaseOperation('product_upsert_success', { productId: product.id });
  } catch (error) {
    logDatabaseOperation('product_upsert_exception', { productId: product.id, error: (error as Error).message }, 'error');
    throw error;
  }
};

const upsertPriceRecord = async (price: Stripe.Price): Promise<void> => {
  try {
    const priceData: Price = {
      id: price.id,
      product_id: typeof price.product === 'string' ? price.product : '',
      active: price.active,
      currency: price.currency,
      description: price.nickname ?? null,
      type: price.type,
      unit_amount: price.unit_amount ?? null,
      interval: price.recurring?.interval ?? null,
      interval_count: price.recurring?.interval_count ?? null,
      trial_period_days: price.recurring?.trial_period_days ?? null,
      metadata: price.metadata
    };

    const { error } = await supabaseAdmin.from('prices').upsert([priceData]);
    
    if (error) {
      logDatabaseOperation('price_upsert_failed', { priceId: price.id, error: error.message }, 'error');
      throw error;
    }
    
    logDatabaseOperation('price_upsert_success', { priceId: price.id });
  } catch (error) {
    logDatabaseOperation('price_upsert_exception', { priceId: price.id, error: (error as Error).message }, 'error');
    throw error;
  }
};

const createOrRetrieveCustomer = async ({
  email,
  uuid
}: {
  email: string;
  uuid: string;
}): Promise<string> => {
  try {
    // First, try to find existing customer
    const { data: existingCustomer, error: selectError } = await supabaseAdmin
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', uuid)
      .single();

    if (selectError) {
      logDatabaseOperation('customer_select_error', { uuid, error: selectError.message }, 'warn');
    }

    // If customer exists, return their Stripe customer ID
    if (existingCustomer?.stripe_customer_id) {
      logDatabaseOperation('customer_found', { uuid, stripeCustomerId: existingCustomer.stripe_customer_id });
      return existingCustomer.stripe_customer_id;
    }

    // No customer record found, create one in Stripe
    logDatabaseOperation('customer_creation_started', { uuid, email });
    
    const stripeCustomerData: { metadata: { supabaseUUID: string }; email?: string } = {
      metadata: {
        supabaseUUID: uuid
      }
    };
    
    if (email) {
      stripeCustomerData.email = email;
    }
    
    const customer = await stripe.customers.create(stripeCustomerData);
    
    // Insert the customer ID into our Supabase mapping table
    const { error: insertError } = await supabaseAdmin
      .from('customers')
      .insert([{ id: uuid, stripe_customer_id: customer.id }]);
      
    if (insertError) {
      logDatabaseOperation('customer_insert_failed', { uuid, stripeCustomerId: customer.id, error: insertError.message }, 'error');
      throw insertError;
    }
    
    logDatabaseOperation('customer_created', { uuid, stripeCustomerId: customer.id });
    return customer.id;
    
  } catch (error) {
    logDatabaseOperation('customer_operation_exception', { uuid, error: (error as Error).message }, 'error');
    throw error;
  }
};

/**
 * Copies the billing details from the payment method to the customer object.
 */
const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod
): Promise<void> => {
  try {
    const customer = payment_method.customer as string;
    const { name, phone, address } = payment_method.billing_details;
    
    if (!name || !phone || !address) {
      logDatabaseOperation('billing_details_incomplete', { uuid, hasName: !!name, hasPhone: !!phone, hasAddress: !!address }, 'warn');
      return;
    }

    // Update Stripe customer with billing details
    await stripe.customers.update(customer, { 
      name, 
      phone, 
      address: {
        city: address.city || undefined,
        country: address.country || undefined,
        line1: address.line1 || undefined,
        line2: address.line2 || undefined,
        postal_code: address.postal_code || undefined,
        state: address.state || undefined
      }
    });
    
    // Update Supabase user with billing details
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        billing_address: { 
          city: address.city || undefined,
          country: address.country || undefined,
          line1: address.line1 || undefined,
          line2: address.line2 || undefined,
          postal_code: address.postal_code || undefined,
          state: address.state || undefined
        },
        payment_method: payment_method.type === 'card' ? payment_method.card as any : undefined
      })
      .eq('id', uuid);
      
    if (error) {
      logDatabaseOperation('billing_details_update_failed', { uuid, error: error.message }, 'error');
      throw error;
    }
    
    logDatabaseOperation('billing_details_updated', { uuid });
  } catch (error) {
    logDatabaseOperation('billing_details_exception', { uuid, error: (error as Error).message }, 'error');
    throw error;
  }
};

const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
): Promise<void> => {
  try {
    // Get customer's UUID from mapping table
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();
      
    if (customerError || !customerData) {
      logDatabaseOperation('customer_not_found', { customerId, error: customerError?.message }, 'error');
      throw new Error(`Customer not found for Stripe customer ID: ${customerId}`);
    }

    const { id: uuid } = customerData;

    // Retrieve subscription from Stripe with expanded payment method
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method']
    });

    // Prepare subscription data for database
    const subscriptionData: Subscription = {
      id: subscription.id,
      user_id: uuid,
      metadata: subscription.metadata,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity ?? null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at
        ? toDateTime(subscription.cancel_at).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? toDateTime(subscription.canceled_at).toISOString()
        : null,
      current_period_start: toDateTime(
        subscription.start_date
      ).toISOString(),
      current_period_end: 
      subscription.cancel_at_period_end && subscription.cancel_at ? 
      toDateTime(
        subscription.cancel_at
      ).toISOString() : undefined,
      created: toDateTime(subscription.created).toISOString(),
      ended_at: subscription.ended_at
        ? toDateTime(subscription.ended_at).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? toDateTime(subscription.trial_start).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? toDateTime(subscription.trial_end).toISOString()
        : null
    };

    // Upsert subscription data
    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert([subscriptionData]);
      
    if (upsertError) {
      logDatabaseOperation('subscription_upsert_failed', { 
        subscriptionId, 
        userId: uuid, 
        error: upsertError.message 
      }, 'error');
      throw upsertError;
    }

    logDatabaseOperation('subscription_upsert_success', { 
      subscriptionId, 
      userId: uuid,
      status: subscription.status 
    });

    // For new subscriptions, copy billing details to customer
    if (createAction && subscription.default_payment_method && uuid) {
      await copyBillingDetailsToCustomer(
        uuid,
        subscription.default_payment_method as Stripe.PaymentMethod
      );
    }
    
  } catch (error) {
    logDatabaseOperation('subscription_management_exception', { 
      subscriptionId, 
      customerId, 
      error: (error as Error).message 
    }, 'error');
    throw error;
  }
};

export {
  upsertProductRecord,
  upsertPriceRecord,
  createOrRetrieveCustomer,
  manageSubscriptionStatusChange
};
