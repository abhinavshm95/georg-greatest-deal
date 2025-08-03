import Stripe from 'stripe';

// Validate required environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing Stripe secret key. Please set STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_LIVE environment variable.');
}

export const stripe = new Stripe(stripeSecretKey, {
  // Use the latest API version
  apiVersion: '2025-07-30.basil',
  
  // Register this as an official Stripe plugin
  appInfo: {
    name: 'The Greatest Deals',
    version: '1.0.0',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://the-greatest-deals.com'
  },
  
  // Configure retry behavior
  maxNetworkRetries: 3,
  
  // Configure timeout
  timeout: 30000, // 30 seconds
});
