'use client';

import { NodeService } from '../utils/node-service';
import { useSupabase } from '@/app/supabase-provider';
import { TreeSelect, TreeSelectSelectionKeysType } from 'primereact/treeselect';
import { FormEvent, useEffect, useRef, useState } from 'react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import { NotificationLimitService } from '@/utils/notification-limit-service';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { PlusIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
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
    { slug: string; level: number, id: string }[]
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
  const [showPassword, setShowPassword] = useState(false);

  const frequencyTiers = [
    { name: 'Basic', value: 5, id: 'basic' },
    { name: 'Growth', value: 20, id: 'growth' },
    { name: 'Pro', value: 50, id: 'pro' }
  ];

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

    return { slug: resultNode.data, level: resultNodeLevel, id: resultNode.id };
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
      console.log("getTreeNodes", data);
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
    setPushNotificationsFrequency(limits.max);
    
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
    const allCategories: { slug: string; level: number, id: string }[] = [];
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

      const { data, error } = await supabase.auth.signUp({
        email: formData.email as string,
        password: formData.password as string
      });

      if (error) {
        setSuccess(false);
        setLoading(false);
        setFormSubmitted(true);
        throw new Error(error.message);
      }

      try {
        // Register user with all data
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            userId: data.user?.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            notificationFrequency: pushNotificationsFrequency,
            notificationChannel: pushNotificationsChannel,
            // notificationAllDeals: formData.allDeals,
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
    <div className="bg-vira-card rounded-3xl shadow-2xl border border-gray-800 p-12 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-12">
          <div className="border-b border-gray-600/30 pb-12">
          <h3 className="text-2xl font-bold leading-8 text-white mb-2">
            Persönliche Angaben
          </h3>
          <p className="text-gray-300 text-lg">
            Wir brauchen nur wenig Informationen über Dich um zu starten. Füge Sie hier ein.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="firstName"
                className="block text-sm font-semibold leading-6 text-gray-200 mb-3"
              >
                Vorname*
              </label>
              <div className="mt-2">
                <input
                  {...register('firstName', { required: true })}
                  type="text"
                  name="firstName"
                  id="firstName"
                  autoComplete="given-name"
                  className="block w-full rounded-lg border-0 py-4 px-5 text-gray-900 bg-gray-100 ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white focus:border-transparent text-base transition-all duration-200 hover:bg-gray-50"
                  placeholder="John"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="lastName"
                className="block text-sm font-semibold leading-6 text-gray-200 mb-3"
              >
                Nachname*
              </label>
              <div className="mt-2">
                <input
                  {...register('lastName', { required: true })}
                  type="text"
                  name="lastName"
                  id="lastName"
                  autoComplete="family-name"
                  className="block w-full rounded-lg border-0 py-4 px-5 text-gray-900 bg-gray-100 ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white focus:border-transparent text-base transition-all duration-200 hover:bg-gray-50"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="email"
                className="block text-sm font-semibold leading-6 text-gray-200 mb-3"
              >
                E-Mail Adresse*  
              </label>
              <div className="mt-2">
                <input
                  {...register('email', { required: true })}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-lg border-0 py-4 px-5 text-gray-900 bg-gray-100 ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white focus:border-transparent text-base transition-all duration-200 hover:bg-gray-50"
                  placeholder="john@doe.com"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="phone"
                className="block text-sm font-semibold leading-6 text-gray-200 mb-3"
              >
                Mobiltelefonnummer (WhatsApp)*
              </label>
              <div className="mt-2">
                <input
                  {...register('phone', { required: true })}
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="phone"
                  className="block w-full rounded-lg border-0 py-4 px-5 text-gray-900 bg-gray-100 ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white focus:border-transparent text-base transition-all duration-200 hover:bg-gray-50"
                  placeholder="+491234567890"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Bitte achten Sie darauf, dass Ihre Telefonnummer mit +49 beginnt und keine Leerzeichen enthält.
              </p>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="password"
                className="block text-sm font-semibold leading-6 text-gray-200 mb-3"
              >
                Passwort*
              </label>
              <div className="mt-2 relative">
                <input
                  {...register('password', { required: true, minLength: 6 })}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full rounded-lg border-0 py-4 px-5 pr-12 text-gray-900 bg-gray-100 ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white focus:border-transparent text-base transition-all duration-200 hover:bg-gray-50"
                  placeholder="Geben Sie Ihr Passwort ein"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="border-b border-gray-900/10 pb-12"
          id="affiliate-programs"
        >
          <h3 className="text-2xl font-bold leading-8 text-white mb-2">
            Affiliate Programme
          </h3>
          <p className="text-gray-300 text-lg mb-8">
            Teile uns hier Deine ID für das Affiliate Programm von Amazon oder AWIN mit. Bist Du bei beiden registriert, füge einfach ein weiteres Programm mit „+“ hinzu. Wir integrieren Deine IDs automatisch mit unseren Linkservice „Viralink“. 
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
                className="block w-full rounded-lg border-0 py-4 px-5 text-gray-900 bg-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white text-base transition-all duration-200 hover:bg-gray-50"
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
                      'block w-full rounded-lg border-0 py-4 px-5 text-gray-900 bg-gray-100 shadow-sm ring-1 ring-inset placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white text-base transition-all duration-200 hover:bg-gray-50',
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
                      'block w-full rounded-lg border-0 py-4 px-5 text-gray-900 bg-gray-100 shadow-sm ring-1 ring-inset placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white text-base transition-all duration-200 hover:bg-gray-50',
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
          <h3 className="text-2xl font-bold leading-8 text-white mb-2">
            Kategorien und Brands
          </h3>
          <p className="text-gray-300 text-lg mb-8">
            Wähle aus, welche Kategorien oder Brands am besten zu Deiner Audience passen. Tip: Sei grosszügig bei der Auswahl, um eine angemessene Anzahl Deals zu bekommen aus denen Du dann wählen kannst. 
          </p>

          <p className="text-sm font-semibold leading-6 text-gray-100 mt-10">
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
                placeholder="Kategorien auswählen"
                filter
              />
            </div>
          </div>
          <p className="text-sm font-semibold leading-6 text-gray-100 mt-10">
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
                placeholder="Ausgewählte Brands"
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

        <div className="border-b border-gray-600/30 pb-12">
          <h3 className="text-2xl font-bold leading-8 text-white mb-2">
            Unsere Services
          </h3>
          <p className="text-gray-300 text-lg mb-8">
            Wähle das Abomodell aus, welches am Besten zu Dir passt.
          </p>

          <div className="flex justify-center mt-6 mb-12">
            <div className="inline-flex rounded-xl bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={() => setBillingInterval('month')}
                className={`px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 ${
                  billingInterval === 'month'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monatliche Abrechnung
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('year')}
                className={`px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 ${
                  billingInterval === 'year'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Jährliche Abrechnung
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-4">
            {plans.map((plan, idx) => (
              <div
                key={plan.product.id}
                className={`relative backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col px-8 py-10 border transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                  selectedPrice?.id === plan.price?.id
                    ? 'bg-white/20 border-blue-400/50 ring-4 ring-blue-400/20 scale-105 z-10'
                    : plan.highlight
                    ? 'bg-white/15 border-blue-400/40 ring-2 ring-blue-400/10'
                    : 'bg-white/10 border-white/20 hover:bg-white/15'
                }`}
                onClick={() => plan.price && handlePriceSelection(plan.price)}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg z-10">
                    {plan.badge}
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-white mb-4">{plan.product.name}</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    {plan.price ?
                      new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: plan.price.currency?.toUpperCase() || 'EUR',
                        minimumFractionDigits: 2
                      }).format((plan.price.unit_amount || 0) / 100)
                      : 'N/A'}
                  </div>
                  <p className="text-gray-300 text-lg">
                    {billingInterval === 'month' ? '/ Monat' : '/ Jahr'}
                  </p>
                </div>

                <ul className="flex-1 w-full mb-10 space-y-4">
                  {plan.features.map((feature: string) => (
                    <li key={feature} className="flex items-start gap-3 text-gray-200">
                      <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-base">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                    selectedPrice?.id === plan.price?.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/20 text-white border border-white/30 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  {selectedPrice?.id === plan.price?.id ? 'Ausgewählt' : 'Auswählen'}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-12 text-sm text-gray-400 text-center max-w-4xl mx-auto">
            <p className="mb-2">* incl. MwSt.</p>
            <p className="mb-2">** Die Anzahl Deals pro Tag hängt von den ausgewählten Kategorien / Brands ab und kann geringer sein als das ausgewählte Paket. Wähle mehr Kategorien / Brands aus, um die maximale Anzahl Deals pro Tag zu erhalten.</p>
            <p>*** Wir verdoppeln während Deal Events für zwei Tage die Anzahl der WhatsApp Nachrichten (Pack1: Black Friday; Pack2: Prime Days, Black Friday)</p>
          </div>
        </div>

        {/* <div className="border-b border-gray-900/10 pb-12">
          <h3 className="text-2xl font-bold leading-8 text-white mb-2">
            Notifications
          </h3>
          <p className="text-gray-300 text-lg mb-8">
            Set your notifications preferences.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-gray-100">
                Frequency
              </legend>
              <p className="text-gray-300 text-lg mb-8">
                How many deal notifications do you want to receive per day?
                {selectedPrice && (
                  <span className="block mt-1 text-xs text-primary-600">
                    {plans.find(plan => plan.price?.id === selectedPrice.id)?.product.name} Plan: up to {frequencyLimits.max} notifications per day
                  </span>
                )}
              </p>
              <div className="mt-6 space-y-6">
                {frequencyTiers.map((tier) => {
                  const isDisabled = frequencyLimits.max < tier.value;
                  return (
                    <div className="flex items-center gap-x-3" key={tier.id}>
                      <input
                        id={tier.id}
                        name="push-notifications-frequency"
                        type="radio"
                        value={tier.value}
                        className="h-4 w-4 border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700 disabled:opacity-50"
                        checked={pushNotificationsFrequency === tier.value}
                        onChange={(e) =>
                          onPushNotificationsFrequencyChange(e.target.value)
                        }
                        disabled={isDisabled}
                      />
                      <label
                        htmlFor={tier.id}
                        className={cn(
                          'block text-sm font-medium leading-6',
                          isDisabled ? 'text-gray-400' : 'text-white'
                        )}
                      >
                        {tier.name} (~{tier.value} per day)
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-gray-100">
                Channel
              </legend>
              <p className="text-gray-300 text-base mb-6">
                These are delivered via WhatsApp to your mobile phone or via
                email.
              </p>
              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-x-4">
                  <input
                    {...register('pushNotificationsChannel')}
                    id="pushWhatsapp"
                    name="push-notifications-channel"
                    type="radio"
                    className="radio-custom"
                    checked={pushNotificationsChannel === 'whatsapp'}
                    onChange={() =>
                      onPushNotificationsChannelChange('whatsapp')
                    }
                  />
                  <label
                    htmlFor="pushWhatsapp"
                    className="text-base font-medium text-white cursor-pointer"
                  >
                    WhatsApp
                  </label>
                </div>
                <div className="flex items-center gap-x-4">
                  <input
                    id="pushEmail"
                    name="push-notifications-channel"
                    type="radio"
                    className="radio-custom opacity-50"
                    checked={pushNotificationsChannel === 'email'}
                    onChange={() => onPushNotificationsChannelChange('email')}
                    disabled
                  />
                  <label
                    htmlFor="pushEmail"
                    className="text-base font-medium text-gray-400 cursor-not-allowed"
                  >
                    Email
                  </label>
                </div>
              </div>
            </fieldset>

            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-gray-100">
                All Deals
              </legend>
              <p className="text-gray-300 text-base mb-6">
                Get notified when a new deal is posted, regardless of your
                affiliate program preferences.
              </p>
            </fieldset>
          </div>
        </div> */}

        {/* <div>
          <p className="mt-1 leading-6 text-gray-300">
            By signing up you agree to the{' '}
            <a href="/service-agreement" className="text-primary-600">
              Closed Beta Service Agreement
            </a>
            .
          </p>
        </div> */}

        {formSubmitted && !success && (
          <div className="block my-6">
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error</strong>
              <span className="block sm:inline pl-4">
                Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.
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
                Sie sind erfolgreich registriert
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-x-6">
          <button
            type="submit"
            className={`rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:from-blue-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 flex transition-all duration-200 transform hover:scale-105 ${!selectedPrice ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
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
            Bestätigen und weiter zur Zahlung
          </button>
        </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
