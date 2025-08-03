'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import type { Database } from '@/types_db';

type Subscription = Database['public']['Tables']['subscriptions']['Row'] & {
  prices?: (Database['public']['Tables']['prices']['Row'] & {
    products?: Database['public']['Tables']['products']['Row'] | null;
  }) | null;
};

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      setSubLoading(true);
      try {
        const res = await fetch('/api/subscription');
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        } else {
          setSubscription(null);
        }
      } catch (e) {
        setSubscription(null);
      } finally {
        setSubLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/create-portal-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to create portal link');
      }
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal link:', error);
      alert('Failed to open subscription management. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Subscription Management
      </h3>
      <p className="text-gray-600 mb-4">
        Manage your subscription, update payment methods, and view billing history.
      </p>
      {subLoading ? (
        <div className="mb-4 text-gray-500">Loading subscription info...</div>
      ) : subscription ? (
        <div className="mb-4">
          <div>Status: <b>{subscription.status?.toUpperCase()}</b></div>
          <div>Plan: <b>{subscription.prices?.products?.name || 'N/A'}</b></div>
          <div>Start: <b>{subscription.current_period_start ? new Date(subscription.current_period_start).toLocaleDateString() : 'N/A'}</b></div>
        </div>
      ) : (
        <div className="mb-4 text-gray-500">No active subscription found.</div>
      )}
      <button
        onClick={handleManageSubscription}
        disabled={loading}
        className={`rounded-md bg-indigo-600 px-8 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex w-full sm:w-auto ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        Manage Subscription
      </button>
    </div>
  );
} 