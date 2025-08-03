'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';
import { Database } from '@/types_db';
import { postData } from '@/utils/helpers';
import { getStripe } from '@/utils/stripe-client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Removed planMeta array and its usages. Use product.metadata instead.

type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Price = Database['public']['Tables']['prices']['Row'];
interface ProductWithPrices extends Product {
  prices: Price[];
}
interface PriceWithProduct extends Price {
  products: Product | null;
}
interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

interface Props {
  // session: Session | null;
  user: User | null | undefined;
  products: ProductWithPrices[];
  subscription: SubscriptionWithProduct | null;
}

type BillingInterval = 'month' | 'year';

export default function Pricing({
  // session,
  user,
  products,
  subscription
}: Props) {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [priceIdLoading, setPriceIdLoading] = useState<string>();

  console.log(products);
  

  // Sort products to show in the order: Basic, Growth, Pro
  const desiredOrder = ['Basic', 'Growth', 'Pro'];
  const sortedProducts = [...products].sort(
    (a, b) =>
      desiredOrder.indexOf(a.name ?? '') - desiredOrder.indexOf(b.name ?? '')
  );

  // Map API products to UI plans by order
  const plans = sortedProducts.map((product) => {
    const price = product.prices.find((p) => p.interval === billingInterval);
    // Typecast metadata to expected structure
    const metadata = product.metadata as {
      features?: string[];
      highlight?: boolean;
      badge?: string;
    } | null;
    return {
      product,
      price,
      features: metadata?.features || [],
      highlight: metadata?.highlight || false,
      badge: metadata?.badge,
    };
  });

  const handleCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);
    if (!user) {
      return router.push('/signin');
    }
    if (subscription) {
      return router.push('/account');
    }
    try {
      const { sessionId } = await postData({
        url: '/api/create-checkout-session',
        data: { price }
      });
      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      return alert((error as Error)?.message);
    } finally {
      setPriceIdLoading(undefined);
    }
  };

  if (!products.length)
    return (
      <section className="bg-gray-50 min-h-screen py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">Pricing</h1>
          <div className="text-center text-lg text-gray-500 py-20">
            No subscription pricing plans found. Create them in your{' '}
            <a
              className="text-blue-600 underline"
              href="https://dashboard.stripe.com/products"
              rel="noopener noreferrer"
              target="_blank"
            >
              Stripe Dashboard
            </a>
            .
          </div>
        </div>
      </section>
    );

  return (
    <section className="min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">Pricing</h1>
        <div className="flex justify-center mt-6 mb-10">
          <div className="inline-flex rounded-lg bg-white p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10 ${
                billingInterval === 'month'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10 ${
                billingInterval === 'year'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Yearly billing
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-stretch mt-10">
          {plans.map((plan, idx) => (
            <div
              key={plan.product.id}
              className={`relative flex-1 bg-white rounded-3xl shadow-lg flex flex-col items-center px-6 py-10 border transition-transform duration-200 ${
                plan.highlight
                  ? 'border-indigo-600 scale-105 z-10 shadow-2xl'
                  : 'border-gray-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow">
                  {plan.badge}
                </div>
              )}
              <h2 className="text-2xl font-bold text-center mb-2">{plan.product.name}</h2>
              <div className="text-2xl font-semibold text-center mb-6">
                {plan.price ?
                  new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: plan.price.currency?.toUpperCase() || 'EUR',
                    minimumFractionDigits: 2
                  }).format((plan.price.unit_amount || 0) / 100) +
                  (billingInterval === 'month' ? ' / month' : ' / year')
                  : 'N/A'}
              </div>
              <ul className="flex-1 w-full mb-8 space-y-3">
                {plan.features.map((feature: string) => (
                  <li key={feature} className="flex items-start gap-2 text-gray-700">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="slim"
                type="button"
                loading={priceIdLoading === plan.price?.id}
                onClick={() => plan.price && handleCheckout(plan.price)}
                className={`!border !border-indigo-500 w-full py-3 !rounded-xl font-semibold text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-indigo-600 hover:bg-indigo-700`}
              >
                {subscription && plan.product.name === subscription?.prices?.products?.name
                  ? 'Manage'
                  : 'Subscribe'}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-10 text-xs text-gray-500 text-center">
          * incl. VAT<br />
          ** The amount of deal messages depends on the selected categories / brands and could be lower.<br />
          *** To maximize your monetization, we will DOUBLE the WA message amount for 2 days during these Deal Events (Pack1: Black Friday; Pack2: Prime Day, Black Friday)
        </div>
      </div>
    </section>
  );
}

