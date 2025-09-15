'use client';

import { NodeService } from '../utils/node-service';
import { useSupabase } from '@/app/supabase-provider';
import { TreeSelect, TreeSelectSelectionKeysType } from 'primereact/treeselect';
import { FormEvent, useEffect, useRef, useState } from 'react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import { NotificationLimitService } from '@/utils/notification-limit-service';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import cn from 'classnames';
import { useRouter } from 'next/navigation';
import { TreeNode } from 'primereact/treenode';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Database } from '@/types_db';
import { postData } from '@/utils/helpers';
import { getStripe } from '@/utils/stripe-client';
import { User } from '@supabase/supabase-js';

type Inputs = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  pushNotificationsChannel: string;
  allDeals: boolean;
};

// Pricing types
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

type BillingInterval = 'month' | 'year';

// This is the registration form for the user.
// It contains the personal information, the affiliate programs, the category and brand preferences and the notifications preferences.
const RegisterForm = ({ products }: { products: ProductWithPrices[] }) => {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [maxDeals, setMaxDeals] = useState(100);
  const [allCategories, setAllCategories] = useState<
    { slug: string; level: number }[]
  >([]);
  const [noCategories, setNoCategories] = useState(false);
  const [noAffiliatePrograms, setNoAffiliatePrograms] = useState(false);

  // Pricing state
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<Inputs>();

  const router = useRouter();

  const [pushNotificationsFrequency, setPushNotificationsFrequency] =
    useState<number>(1);
  const [pushNotificationsChannel, setPushNotificationsChannel] =
    useState('whatsapp');

  const onPushNotificationsFrequencyChange = (value: string) => {
    const newValue = Number(value);
    setPushNotificationsFrequency(newValue);
  };

  const onPushNotificationsChannelChange = (value: string) => {
    setPushNotificationsChannel(value);
  };

  // Pricing functions
  const handlePriceSelection = (price: Price) => {
    setSelectedPrice(price);
  };

  const handleCheckout = async () => {
    if (!selectedPrice) {
      return alert('Please select a pricing plan');
    }
    
    try {
      const { sessionId } = await postData({
        url: '/api/create-checkout-session',
        data: { price: selectedPrice }
      });
      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      return alert((error as Error)?.message);
    }
  };

  const onChangeCategories = async (event: any) => {
    setSelectedCategoriesKeys(event.value);
  };

  const onChangeBrands = async (event: any) => {
    setSelectedBrandsKeys(event.value);
  };

  // extract category from tree format by index
  const getCategory = async (index: string, tree: any) => {
    const indexArray = index.split('-');
    let resultNode = tree[indexArray[0]];
    let resultNodeLevel = 1;

    for (let i = 1; i < indexArray.length; i++) {
      resultNode = resultNode.children[indexArray[i]];
      resultNodeLevel = i + 1;
    }

    return { slug: resultNode.data, level: resultNodeLevel };
  };

  const amazonAffiliateIdRef = useRef<HTMLInputElement>(null);
  const awinAffiliateIdRef = useRef<HTMLInputElement>(null);

  const [currentAffiliateProgram, setCurrentAffiliateProgram] =
    useState<string>('Amazon');

  const [currentAffiliateProgramValue, setCurrentAffiliateProgramValue] =
    useState<string>('');

  const [affiliatePrograms, setAffiliatePrograms] = useState<
    { name: string; value: string }[]
  >([]);

  const onChangeAffiliateProgram = (event: FormEvent<HTMLSelectElement>) => {
    setCurrentAffiliateProgram(event.currentTarget.value);
  };

  const onAddAffiliateProgramAmazon = (event: FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setAffiliatePrograms([
      ...affiliatePrograms,
      {
        name: currentAffiliateProgram,
        value: amazonAffiliateIdRef.current?.value || ''
      }
    ]);
    if (amazonAffiliateIdRef.current !== null) {
      amazonAffiliateIdRef.current.value = '';
    }
  };

  const onAddAffiliateProgramAwin = (event: FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setAffiliatePrograms([
      ...affiliatePrograms,
      {
        name: currentAffiliateProgram,
        value: awinAffiliateIdRef.current?.value || ''
      }
    ]);
    if (awinAffiliateIdRef.current !== null) {
      awinAffiliateIdRef.current.value = '';
    }
  };

  const [categories, setCategories] = useState<TreeNode[]>([]);
  const [selectedCategoriesKeys, setSelectedCategoriesKeys] = useState<
    | string
    | TreeSelectSelectionKeysType
    | TreeSelectSelectionKeysType[]
    | null
    | undefined
  >(null);

  const [brands, setBrands] = useState<TreeNode[]>([]);
  const [selectedBrandsKeys, setSelectedBrandsKeys] = useState<
    | string
    | TreeSelectSelectionKeysType
    | TreeSelectSelectionKeysType[]
    | null
    | undefined
  >(null);

  useEffect(() => {
    NodeService.getTreeNodes().then((data) => {
      setCategories(data);
      setBrands(data);
    });
  }, []);

  useEffect(() => {
    if (currentAffiliateProgramValue != '') {
      setNoAffiliatePrograms(false);
    }
  }, [currentAffiliateProgramValue]);

  useEffect(() => {
    transformCategories();
  }, [selectedCategoriesKeys, selectedBrandsKeys]);

  // Update frequency when plan changes to stay within limits
  useEffect(() => {
    const limits = getFrequencyLimits();
    if (pushNotificationsFrequency > limits.max) {
      setPushNotificationsFrequency(limits.max);
    } else if (pushNotificationsFrequency < limits.min) {
      setPushNotificationsFrequency(limits.min);
    }
  }, [selectedPrice]);

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

  // Get frequency limits based on selected plan
  const getFrequencyLimits = () => {
    if (!selectedPrice) return { min: 1, max: 5 }; // Default to Basic limits
    
    const selectedPlan = plans.find(plan => plan.price?.id === selectedPrice.id);
    if (!selectedPlan) return { min: 1, max: 5 };
    
    // Use the max_notification_limit from the database
    const maxLimit = selectedPlan.product.max_notification_limit || 5;
    return { min: 1, max: maxLimit };
  };

  const frequencyLimits = getFrequencyLimits();

  const transformCategories = async () => {
    // get selected categories
    const tree = await NodeService.getTreeNodes();
    let transformedCategories = [];
    let transformedBrands = [];

    // convert selected categories to db format and push all to transformedCategories array
    if (typeof selectedCategoriesKeys === 'object') {
      let subtreesToSkip: string[] = [];

      for (const key in selectedCategoriesKeys) {
        if (selectedCategoriesKeys.hasOwnProperty(key)) {
          // @ts-ignore
          const value = selectedCategoriesKeys[key];
          if (!subtreesToSkip.some((substring) => key.startsWith(substring))) {
            if (!value.partialChecked) {
              subtreesToSkip.push(key);
              const category = await getCategory(key, tree);
              transformedCategories.push(category);
            }
          }
        }
      }
    }

    // convert selected brands to db format and push all to transformedBrands array
    if (typeof selectedBrandsKeys === 'object') {
      let subtreesToSkip: string[] = [];

      for (const key in selectedBrandsKeys) {
        if (selectedBrandsKeys.hasOwnProperty(key)) {
          // @ts-ignore
          const value = selectedBrandsKeys[key];
          if (!subtreesToSkip.some((substring) => key.startsWith(substring))) {
            if (!value.partialChecked) {
              subtreesToSkip.push(key);
              const category = await getCategory(key, tree);
              transformedBrands.push(category);
            }
          }
        }
      }
    }

    const brandsAndCategories = [
      ...transformedCategories,
      ...transformedBrands
    ];

    // remove duplicates from brandsAndCategories array
    const allCategories: { slug: string; level: number }[] = [];
    brandsAndCategories.forEach((item) => {
      if (
        !allCategories.some(
          (categoryOrBrand) => categoryOrBrand.slug === item.slug
        )
      ) {
        allCategories.push(item);
      }
    });

    setAllCategories(allCategories);
    allCategories.length > 0 && setNoCategories(false);

    const updatedNotificationLimit =
      await NotificationLimitService.getNotificationLimit(allCategories);
    setMaxDeals(updatedNotificationLimit);
  };

  const onSubmit: SubmitHandler<Inputs> = async (formData) => {
    if (affiliatePrograms.length < 1 && !currentAffiliateProgramValue) {
      // set error message
      setNoAffiliatePrograms(true);

      // scroll to affiliate programs section
      router.push('#affiliate-programs');
    } else if (allCategories.length < 1) {
      // set error message
      setNoCategories(true);

      // scroll to categories section
      router.push('#categories');
    } else if (!selectedPrice) {
      // set error message for pricing
      alert('Please select a pricing plan');
      return;
    } else {
      const allAffiliatePrograms = [
        ...affiliatePrograms,
        {
          name: currentAffiliateProgram,
          value: currentAffiliateProgramValue
        }
      ];

      setLoading(true);

      try {
        // Register user with all data
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            notificationFrequency: pushNotificationsFrequency,
            notificationChannel: pushNotificationsChannel,
            notificationAllDeals: formData.allDeals,
            categories: JSON.stringify(allCategories),
            affiliatePrograms: JSON.stringify(allAffiliatePrograms)
          })
        });
        
        if (response.ok) {
          // Step 2: Redirect to Stripe checkout
          await handleCheckout();
        } else {
          setSuccess(false);
          setLoading(false);
          setFormSubmitted(true);
        }
      } catch (err: any) {
        setSuccess(false);
        setLoading(false);
        setFormSubmitted(true);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="my-8 space-y-8 max-w-screen-md">
        <div className="border-b border-gray-900/10 pb-12">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Personal Information
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Use a permanent address where you can receive mail.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                First name*
              </label>
              <div className="mt-2">
                <input
                  {...register('firstName', { required: true })}
                  type="text"
                  name="firstName"
                  id="firstName"
                  autoComplete="given-name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="John"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Last name*
              </label>
              <div className="mt-2">
                <input
                  {...register('lastName', { required: true })}
                  type="text"
                  name="lastName"
                  id="lastName"
                  autoComplete="family-name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Email address*
              </label>
              <div className="mt-2">
                <input
                  {...register('email', { required: true })}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="john@doe.com"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="phone"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Mobile Phone*
              </label>
              <div className="mt-2">
                <input
                  {...register('phone', { required: true })}
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="phone"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="+491234567890"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Please make sure your phone number starts with +49 and has no
                blank spaces.
              </p>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Password*
              </label>
              <div className="mt-2">
                <input
                  {...register('password', { required: true, minLength: 6 })}
                  id="password"
                  name="password"
                  type="password"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="border-b border-gray-900/10 pb-12"
          id="affiliate-programs"
        >
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Affiliate Programs
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            To start, all you need is an account with the Amazon Associates
            Program and/ or AWIN to monetize the links we will send you.{' '}
            <br></br> We will automatically add your account-ID to the links we
            send you, so you can post them right away.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            {affiliatePrograms.map((affiliateProgram, idx) => (
              <>
                <div className="sm:col-span-2 ">
                  <input
                    id={`affiliateProgram${idx}`}
                    name={`affiliateProgram${idx}`}
                    autoComplete="affiliateProgram"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-400 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:max-w-xs sm:text-sm sm:leading-6"
                    disabled
                    value={affiliateProgram.name}
                  />
                </div>
                <div className="sm:col-span-4 flex items-end">
                  <input
                    id={`affiliateId${idx}`}
                    name="affiliateId"
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-400 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    disabled
                    value={affiliateProgram.value}
                  />
                </div>
              </>
            ))}
            <div className="sm:col-span-2">
              <select
                id="affiliateProgram"
                name="affiliateProgram"
                autoComplete="affiliateProgram"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:max-w-xs sm:text-sm sm:leading-6"
                onChange={onChangeAffiliateProgram}
              >
                <option>Amazon</option>
                <option>AWIN</option>
              </select>
            </div>

            {currentAffiliateProgram == 'Amazon' ? (
              <>
                <div className="sm:col-span-4 flex items-end">
                  <input
                    ref={amazonAffiliateIdRef}
                    id="affiliateIdAmazon"
                    name="affiliateIdAmazon"
                    type="text"
                    placeholder="Affiliate ID"
                    className={cn(
                      'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6',
                      noAffiliatePrograms ? 'ring-red-500' : 'ring-gray-300'
                    )}
                    onChange={(e) => {
                      setCurrentAffiliateProgramValue(e.target.value);
                    }}
                  />
                </div>
                <div className="sm:col-span-1 items-end flex">
                  <button
                    className="rounded-md bg-primary-600 p-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:hover:bg-gray-200"
                    onClick={onAddAffiliateProgramAmazon}
                    disabled={!currentAffiliateProgramValue}
                  >
                    <PlusIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </>
            ) : null}
            {currentAffiliateProgram == 'AWIN' ? (
              <>
                <div className="sm:col-span-4 flex items-end">
                  <input
                    ref={awinAffiliateIdRef}
                    id="affiliateIdAwin"
                    name="affiliateIdAwin"
                    type="text"
                    placeholder="Affiliate ID"
                    className={cn(
                      'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6',
                      noAffiliatePrograms ? 'ring-red-500' : 'ring-gray-300'
                    )}
                    onChange={(e) => {
                      setCurrentAffiliateProgramValue(e.target.value);
                    }}
                  />
                </div>
                <div className="sm:col-span-1 items-end flex">
                  <button
                    className="rounded-md bg-primary-600 p-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    onClick={onAddAffiliateProgramAwin}
                    disabled={!currentAffiliateProgramValue}
                  >
                    <PlusIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
          {noAffiliatePrograms && (
            <div className="rounded-md bg-red-50 p-4 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className="h-5 w-5 text-red-400"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    There were an error with your submission
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>It is required to add at least one affiliate ID.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-900/10 pb-12" id="categories">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Category and Brand Preferences
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Select the categories and brands you are interested in.
          </p>

          <p className="text-sm font-semibold leading-6 text-gray-900 mt-10">
            Categories
          </p>
          <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="card flex justify-content-center w-100 col-span-full">
              <TreeSelect
                value={selectedCategoriesKeys}
                onChange={onChangeCategories}
                options={categories}
                metaKeySelection={false}
                className={cn(
                  'md:w-20rem w-full border rounded-md',
                  noCategories ? 'border-red-500' : 'border-gray-300'
                )}
                selectionMode="checkbox"
                display="chip"
                placeholder="Select Categories"
                filter
              />
            </div>
          </div>
          <p className="text-sm font-semibold leading-6 text-gray-900 mt-10">
            Brands
          </p>
          <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="card flex justify-content-center w-100 col-span-full">
              <TreeSelect
                value={selectedBrandsKeys}
                onChange={onChangeBrands}
                options={brands}
                metaKeySelection={false}
                className={cn(
                  'md:w-20rem w-full border rounded-md',
                  noCategories ? 'border-red-500' : 'border-gray-300'
                )}
                selectionMode="checkbox"
                display="chip"
                placeholder="Select Brands"
                filter
              />
            </div>
          </div>
          {noCategories && (
            <div className="rounded-md bg-red-50 p-4 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className="h-5 w-5 text-red-400"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    There were an error with your submission
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      It is required to select at least one category or one
                      brand.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-900/10 pb-12">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Pricing Plan
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Choose your subscription plan to get started.
          </p>

          <div className="flex justify-center mt-6 mb-10">
            <div className="inline-flex rounded-lg bg-white p-1 border border-gray-200 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingInterval('month')}
                className={`px-6 py-2 rounded-md font-medium text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10 ${
                  billingInterval === 'month'
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('year')}
                className={`ml-1 px-6 py-2 rounded-md font-medium text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10 ${
                  billingInterval === 'year'
                    ? 'bg-primary-600 text-white shadow'
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
                className={`relative flex-1 bg-white rounded-3xl shadow-lg flex flex-col items-center px-6 py-10 border transition-transform duration-200 cursor-pointer ${
                  selectedPrice?.id === plan.price?.id
                    ? 'border-primary-600 scale-105 z-10 shadow-2xl'
                    : plan.highlight
                    ? 'border-primary-600 scale-105 z-10 shadow-2xl'
                    : 'border-gray-200 hover:scale-105'
                }`}
                onClick={() => plan.price && handlePriceSelection(plan.price)}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow">
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
                <div className={`w-full py-3 rounded-xl font-semibold text-center transition-colors duration-150 ${
                  selectedPrice?.id === plan.price?.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedPrice?.id === plan.price?.id ? 'Selected' : 'Select Plan'}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-xs text-gray-500 text-center">
            * incl. VAT<br />
            ** The amount of deal messages depends on the selected categories / brands and could be lower.<br />
            *** To maximize your monetization, we will DOUBLE the WA message amount for 2 days during these Deal Events (Pack1: Black Friday; Pack2: Prime Day, Black Friday)
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-12">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Notifications
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Set your notifications preferences.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-gray-900">
                Frequency
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                How many deal notifications do you want to receive per day?
                {selectedPrice && (
                  <span className="block mt-1 text-xs text-primary-600">
                    {plans.find(plan => plan.price?.id === selectedPrice.id)?.product.name} Plan: {frequencyLimits.min} - {frequencyLimits.max} notifications per day
                  </span>
                )}
              </p>
              <div className="relative my-6 mb-2">
                <span className="text-xl">
                  ~ {pushNotificationsFrequency} per Day
                </span>
              </div>
              <div className="relative my-6 mb-20">
                <label htmlFor="labels-range-input" className="sr-only">
                  Labels range
                </label>
                <input
                  id="labels-range-input"
                  type="range"
                  min={frequencyLimits.min}
                  max={frequencyLimits.max}
                  value={pushNotificationsFrequency}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:ring-primary-300 focus:ring-1 accent-primary-600"
                  onChange={(e) =>
                    onPushNotificationsFrequencyChange(e.target.value)
                  }
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6">
                  ~ {frequencyLimits.min} per Day
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6">
                  ~ {frequencyLimits.max} per Day
                </span>
              </div>
            </fieldset>

            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-gray-900">
                Channel
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                These are delivered via WhatsApp to your mobile phone or via
                email.
              </p>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-x-3">
                  <input
                    {...register('pushNotificationsChannel')}
                    id="pushWhatsapp"
                    name="push-notifications-channel"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                    checked={pushNotificationsChannel === 'whatsapp'}
                    onChange={() =>
                      onPushNotificationsChannelChange('whatsapp')
                    }
                  />
                  <label
                    htmlFor="pushWhatsapp"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    WhatsApp
                  </label>
                </div>
                <div className="flex items-center gap-x-3">
                  <input
                    id="pushEmail"
                    name="push-notifications-channel"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                    checked={pushNotificationsChannel === 'email'}
                    onChange={() => onPushNotificationsChannelChange('email')}
                    disabled
                  />
                  <label
                    htmlFor="pushEmail"
                    className="block text-sm font-medium leading-6 text-gray-300"
                  >
                    Email
                  </label>
                </div>
              </div>
            </fieldset>

            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-gray-900">
                All Deals
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Get notified when a new deal is posted, regardless of your
                affiliate program preferences.
              </p>
              <div className="mt-6 space-y-6">
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      {...register('allDeals')}
                      id="allDeals"
                      name="all-deals"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label
                      htmlFor="allDeals"
                      className="font-medium text-gray-900"
                    >
                      All Deals notifications
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        <div>
          <p className="mt-1 leading-6 text-gray-600">
            By signing up you agree to the{' '}
            <a href="/service-agreement" className="text-primary-600">
              Closed Beta Service Agreement
            </a>
            .
          </p>
        </div>

        {formSubmitted && !success && (
          <div className="block my-6">
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error</strong>
              <span className="block sm:inline pl-4">
                Something went wrong. Please try again later.
              </span>
            </div>
          </div>
        )}
        {formSubmitted && success && (
          <div className="block my-6">
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Success</strong>
              <span className="block sm:inline pl-4">
                You are signed up successfully
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-x-6">
          <button
            type="submit"
            className={`rounded-md bg-primary-600 px-8 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 flex ${!selectedPrice ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading || !selectedPrice}
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
            Sign up & Continue to Payment
          </button>
        </div>

        <div>
          <p className="mt-6 text leading-6 text-gray-600">
            Thanks so much for helping to improve our service.
          </p>
          <p className="mt-6 text leading-6 text-gray-600">
            Please send any feedback to:{' '}
            <a href="mailto:team@omg-ecom.com" className="text-primary-600">
              team@omg-ecom.com
            </a>
          </p>
          <p className="mt-6 text leading-6 text-gray-600">Have a nice day.</p>
        </div>
      </div>
    </form>
  );
};

export default RegisterForm;
