import Stripe from 'stripe';
import { stripe } from './stripe';

/**
 * Utility functions for testing webhook functionality
 */

export interface WebhookTestConfig {
  webhookSecret: string;
  endpointUrl: string;
}

/**
 * Generate a test webhook signature for testing
 */
export const generateTestWebhookSignature = (
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): string => {
  const signedPayload = `${timestamp}.${payload}`;
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
};

/**
 * Create a test webhook event
 */
export const createTestWebhookEvent = (
  eventType: string,
  data: any
): Stripe.Event => {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2024-12-18.acacia',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: null
    },
    type: eventType
  } as Stripe.Event;
};

/**
 * Sample test data for different webhook events
 */
export const sampleWebhookData = {
  product: {
    id: 'prod_test_product',
    object: 'product',
    active: true,
    created: Math.floor(Date.now() / 1000),
    default_price: null,
    description: 'Test product for webhook testing',
    images: [],
    livemode: false,
    metadata: {},
    name: 'Test Product',
    package_dimensions: null,
    shippable: null,
    statement_descriptor: null,
    tax_code: null,
    unit_label: null,
    updated: Math.floor(Date.now() / 1000),
    url: null
  } as Stripe.Product,

  price: {
    id: 'price_test_price',
    object: 'price',
    active: true,
    billing_scheme: 'per_unit',
    created: Math.floor(Date.now() / 1000),
    currency: 'usd',
    custom_unit_amount: null,
    livemode: false,
    lookup_key: null,
    metadata: {},
    nickname: 'Test Price',
    product: 'prod_test_product',
    recurring: {
      aggregate_usage: null,
      interval: 'month',
      interval_count: 1,
      trial_period_days: null,
      usage_type: 'licensed'
    },
    tax_behavior: 'unspecified',
    tiers_mode: null,
    transform_quantity: null,
    type: 'recurring',
    unit_amount: 2000,
    unit_amount_decimal: '2000'
  } as Stripe.Price,

  subscription: {
    id: 'sub_test_subscription',
    object: 'subscription',
    application: null,
    application_fee_percent: null,
    automatic_tax: {
      enabled: false
    },
    billing_cycle_anchor: Math.floor(Date.now() / 1000),
    billing_thresholds: null,
    cancel_at: null,
    cancel_at_period_end: false,
    canceled_at: null,
    cancellation_details: null,
    collection_method: 'charge_automatically',
    created: Math.floor(Date.now() / 1000),
    currency: 'usd',
    current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    current_period_start: Math.floor(Date.now() / 1000),
    customer: 'cus_test_customer',
    days_until_due: null,
    default_payment_method: null,
    default_source: null,
    default_tax_rates: [],
    description: null,
    discount: null,
    ended_at: null,
    items: {
      object: 'list',
      data: [{
        id: 'si_test_subscription_item',
        object: 'subscription_item',
        billing_thresholds: null,
        created: Math.floor(Date.now() / 1000),
        metadata: {},
        price: {
          id: 'price_test_price',
          object: 'price',
          active: true,
          billing_scheme: 'per_unit',
          created: Math.floor(Date.now() / 1000),
          currency: 'usd',
          custom_unit_amount: null,
          livemode: false,
          lookup_key: null,
          metadata: {},
          nickname: 'Test Price',
          product: 'prod_test_product',
          recurring: {
            aggregate_usage: null,
            interval: 'month',
            interval_count: 1,
            trial_period_days: null,
            usage_type: 'licensed'
          },
          tax_behavior: 'unspecified',
          tiers_mode: null,
          transform_quantity: null,
          type: 'recurring',
          unit_amount: 2000,
          unit_amount_decimal: '2000'
        },
        quantity: 1,
        subscription: 'sub_test_subscription',
        tax_rates: []
      }],
      has_more: false,
      total_count: 1,
      url: '/v1/subscription_items?subscription=sub_test_subscription'
    },
    livemode: false,
    metadata: {},
    next_pending_invoice_item_invoice: null,
    on_behalf_of: null,
    pause_collection: null,
    payment_behavior: null,
    payment_settings: {
      payment_method_options: null,
      payment_method_types: null,
      save_default_payment_method: 'off'
    },
    pending_invoice_item_interval: null,
    pending_setup_intent: null,
    pending_update: null,
    quantity: 1,
    schedule: null,
    start_date: Math.floor(Date.now() / 1000),
    status: 'active',
    test_clock: null,
    transfer_data: null,
    trial_end: null,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'create_invoice'
      }
    },
    trial_start: null
  } as Stripe.Subscription,

  checkoutSession: {
    id: 'cs_test_checkout_session',
    object: 'checkout.session',
    after_expiration: null,
    allow_promotion_codes: null,
    amount_subtotal: 2000,
    amount_total: 2000,
    automatic_tax: {
      enabled: false,
      status: null
    },
    billing_address_collection: null,
    cancel_url: 'https://example.com/cancel',
    client_reference_id: null,
    consent: null,
    consent_collection: null,
    created: Math.floor(Date.now() / 1000),
    currency: 'usd',
    currency_conversion: null,
    custom_fields: [],
    custom_text: {
      after_submit: null,
      shipping_address: null,
      submit: null
    },
    customer: 'cus_test_customer',
    customer_creation: null,
    customer_details: {
      address: null,
      email: 'test@example.com',
      name: 'Test Customer',
      phone: null,
      tax_exempt: 'none',
      tax_ids: []
    },
    customer_email: null,
    expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    invoice: null,
    invoice_creation: null,
    livemode: false,
    locale: null,
    metadata: {},
    mode: 'subscription',
    payment_intent: null,
    payment_link: null,
    payment_method_collection: null,
    payment_method_options: {},
    payment_method_types: ['card'],
    payment_status: 'paid',
    phone_number_collection: {
      enabled: false
    },
    recovered_from: null,
    setup_intent: null,
    shipping_address_collection: null,
    shipping_cost: null,
    shipping_details: null,
    shipping_options: [],
    status: 'complete',
    submit_type: null,
    subscription: 'sub_test_subscription',
    success_url: 'https://example.com/success',
    total_details: {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: 0
    },
    ui_mode: null,
    url: null
  } as Stripe.Checkout.Session
};

/**
 * Test webhook endpoint functionality
 */
export const testWebhookEndpoint = async (
  config: WebhookTestConfig,
  eventType: string,
  data: any
): Promise<{ success: boolean; response: any; error?: string }> => {
  try {
    const event = createTestWebhookEvent(eventType, data);
    const payload = JSON.stringify(event);
    const signature = generateTestWebhookSignature(payload, config.webhookSecret);

    const response = await fetch(config.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    });

    const responseData = await response.json();

    return {
      success: response.ok,
      response: responseData,
      error: response.ok ? undefined : responseData.error
    };
  } catch (error) {
    return {
      success: false,
      response: null,
      error: (error as Error).message
    };
  }
};

/**
 * Validate webhook configuration
 */
export const validateWebhookConfig = (config: WebhookTestConfig): string[] => {
  const errors: string[] = [];

  if (!config.webhookSecret) {
    errors.push('Webhook secret is required');
  }

  if (!config.endpointUrl) {
    errors.push('Endpoint URL is required');
  }

  if (config.webhookSecret && !config.webhookSecret.startsWith('whsec_')) {
    errors.push('Webhook secret should start with "whsec_"');
  }

  if (config.endpointUrl && !config.endpointUrl.startsWith('http')) {
    errors.push('Endpoint URL should be a valid HTTP URL');
  }

  return errors;
};

/**
 * Run comprehensive webhook tests
 */
export const runWebhookTests = async (config: WebhookTestConfig): Promise<void> => {
  console.log('🧪 Running webhook tests...\n');

  // Validate configuration
  const configErrors = validateWebhookConfig(config);
  if (configErrors.length > 0) {
    console.error('❌ Configuration errors:');
    configErrors.forEach(error => console.error(`  - ${error}`));
    return;
  }

  // Test different event types
  const testCases = [
    {
      name: 'Product Created',
      eventType: 'product.created',
      data: sampleWebhookData.product
    },
    {
      name: 'Price Created',
      eventType: 'price.created',
      data: sampleWebhookData.price
    },
    {
      name: 'Subscription Created',
      eventType: 'customer.subscription.created',
      data: sampleWebhookData.subscription
    },
    {
      name: 'Checkout Session Completed',
      eventType: 'checkout.session.completed',
      data: sampleWebhookData.checkoutSession
    }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    const result = await testWebhookEndpoint(
      config,
      testCase.eventType,
      testCase.data
    );

    if (result.success) {
      console.log(`✅ ${testCase.name}: Success`);
    } else {
      console.log(`❌ ${testCase.name}: Failed - ${result.error}`);
    }
    
    console.log('');
  }

  console.log('🎉 Webhook tests completed!');
};

// Example usage (uncomment to use)
/*
const config: WebhookTestConfig = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  endpointUrl: 'http://localhost:3000/api/webhooks'
};

runWebhookTests(config).catch(console.error);
*/ 