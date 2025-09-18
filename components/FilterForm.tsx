'use client';

import { NodeService } from '../utils/node-service';
import { useSupabase } from '@/app/supabase-provider';
import { TreeSelect, TreeSelectSelectionKeysType } from 'primereact/treeselect';
import { FormEvent, useEffect, useRef, useState } from 'react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import cn from 'classnames';
import { useRouter } from 'next/navigation';
import { TreeNode } from 'primereact/treenode';
import { useForm, SubmitHandler } from 'react-hook-form';
import type { Database } from '@/types_db';

type Subscription = Database['public']['Tables']['subscriptions']['Row'] & {
  prices?: (Database['public']['Tables']['prices']['Row'] & {
    products?: Database['public']['Tables']['products']['Row'] | null;
  }) | null;
};

type Inputs = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  pushNotificationsChannel: string;
  allDeals: boolean;
};

interface FilterFormProps {
  initUserDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notificationFrequency: number;
    notificationChannel: string;
    notificationAllDeals: boolean;
  };
  initAffiliatePrograms: {
    id: number;
    name: string;
    value: string;
  }[];
  initCategories: {
    id: string;
    name: string;
    slug: string;
    level: number;
  }[];
}

// This is the registration form for the user.
// It contains the personal information, the affiliate programs, the category and brand preferences and the notifications preferences.
const FilterForm = ({
  initUserDetails: {
    firstName,
    lastName,
    email,
    phone,
    notificationFrequency,
    notificationChannel,
    notificationAllDeals
  },
  initAffiliatePrograms,
  initCategories
}: FilterFormProps) => {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [maxDeals, setMaxDeals] = useState(100);
  const [allCategories, setAllCategories] = useState<TreeNode[]>([]);
  const [noCategories, setNoCategories] = useState(false);
  const [noAffiliatePrograms, setNoAffiliatePrograms] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [addAffiliateProgram, setAddAffiliateProgram] = useState(false);
  
  // Subscription management state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [manageSubLoading, setManageSubLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<Inputs>();

  const router = useRouter();

  const [pushNotificationsFrequency, setPushNotificationsFrequency] =
    useState<number>(notificationFrequency);
  const [pushNotificationsChannel, setPushNotificationsChannel] =
    useState(notificationChannel);

  const onPushNotificationsFrequencyChange = (value: string) => {
    setPushNotificationsFrequency(Number(value));
  };

  const onPushNotificationsChannelChange = (value: string) => {
    setPushNotificationsChannel(value);
  };

  const dbCategoriesToTreeNodesRecHelper = (
    categories: any[],
    allCategories: TreeNode[],
    parentKey: string = '',
    treeNodes: TreeSelectSelectionKeysType = {},
    hit = false
  ) => {
    allCategories.map((category, idx) => {
      var currentHit = hit;
      categories.map((dbCategory) => {
        if (dbCategory.slug == category.data || currentHit) {
          treeNodes = {
            ...treeNodes,
            [parentKey == '' ? idx : parentKey + '-' + idx]: {
              checked: true,
              partialChecked: false
            }
          };
          currentHit = true;
        }
      });

      if (category.children && category.children.length > 0) {
        treeNodes = dbCategoriesToTreeNodesRecHelper(
          categories,
          category.children,
          parentKey == '' ? String(idx) : parentKey + '-' + idx,
          treeNodes,
          currentHit
        );
      }
    });

    return treeNodes;
  };

  const dbCategoriesToTreeNodes = (
    categories: any[],
    allCategories: TreeNode[]
  ) => {
    const selectedCategories = dbCategoriesToTreeNodesRecHelper(
      categories,
      allCategories
    );

    // add partial checked categories
    Object.keys(selectedCategories).map((key) => {
      const allKeys = getAllKeys(key.split('-'));
      allKeys.map((key) => {
        if (!selectedCategories[key]) {
          selectedCategories[key] = {
            checked: false,
            partialChecked: true
          };
        }
      });
    });
    return selectedCategories;
  };

  const getAllKeys = (parts: string[]) => {
    return parts.reduce((result: string[], part, index) => {
      if (index === 0) {
        result.push(part);
      } else {
        result.push(result[index - 1] + '-' + part);
      }
      return result;
    }, []);
  };

  const getCategories = async () => {
    await NodeService.getTreeNodes().then((data) => {
      setAllCategories(data);
      if (initCategories) {
        const selectedCategories = dbCategoriesToTreeNodes(
          initCategories,
          data
        );
        setSelectedCategoriesKeys(selectedCategories);
      }
    });
    setLoadingCategories(false);
  };

  const amazonAffiliateIdRef = useRef<HTMLInputElement>(null);
  const awinAffiliateIdRef = useRef<HTMLInputElement>(null);

  const [currentAffiliateProgram, setCurrentAffiliateProgram] =
    useState<string>('Amazon');

  const [currentAffiliateProgramValue, setCurrentAffiliateProgramValue] =
    useState<string>('');

  const [affiliatePrograms, setAffiliatePrograms] = useState<
    { id: Number; name: string; value: string }[]
  >(initAffiliatePrograms);

  const onChangeAffiliateProgram = (
    event: FormEvent<HTMLSelectElement>,
    idx: number
  ) => {
    setCurrentAffiliateProgram(event.currentTarget.value);
  };

  const onAddAffiliateProgramAmazon = (event: FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setAffiliatePrograms([
      ...affiliatePrograms,
      {
        id: -1,
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
        id: -1,
        name: currentAffiliateProgram,
        value: awinAffiliateIdRef.current?.value || ''
      }
    ]);
    if (awinAffiliateIdRef.current !== null) {
      awinAffiliateIdRef.current.value = '';
    }
  };

  const onChangeAffiliateProgramValue = (
    event: FormEvent<HTMLInputElement>,
    idx: number
  ) => {
    const newAffiliatePrograms = [...affiliatePrograms];
    newAffiliatePrograms[idx].value = event.currentTarget.value;
    setAffiliatePrograms(newAffiliatePrograms);
  };

  const [selectedCategoriesKeys, setSelectedCategoriesKeys] = useState<
    | string
    | TreeSelectSelectionKeysType
    | TreeSelectSelectionKeysType[]
    | null
    | undefined
  >(null);

  useEffect(() => {
    getCategories();
  }, []);

  useEffect(() => {
    if (currentAffiliateProgramValue != '') {
      setNoAffiliatePrograms(false);
    }
  }, [currentAffiliateProgramValue]);

  useEffect(() => {
    transformCategories();
  }, [selectedCategoriesKeys]);

  // Fetch subscription data
  useEffect(() => {
    async function fetchSubscription() {
      setSubLoading(true);
      try {
        const res = await fetch('/api/subscription');
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
          
          // Set max notification limit based on subscription plan
          if (data.subscription?.prices?.products?.max_notification_limit) {
            setMaxDeals(data.subscription.prices.products.max_notification_limit);
          }
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
      setManageSubLoading(true);
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
      setManageSubLoading(false);
    }
  };

  const transformCategories = async () => {
    const selectedCategoriesDbFromat = await NodeService.transformCategories(
      selectedCategoriesKeys,
      [],
      allCategories
    );

    console.log('selectedCategoriesDbFromat', selectedCategoriesDbFromat);
    console.log('selectedCategoriesKeys', selectedCategoriesKeys);
    console.log('allCategories', allCategories);

    // Use subscription-based notification limit instead of NotificationLimitService
    // The maxDeals is already set from the subscription data in the useEffect
    // This function now only handles category transformation
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
    } else {
      const allAffiliatePrograms =
        currentAffiliateProgramValue !== ''
          ? [
              ...affiliatePrograms,
              {
                id: -1,
                name: currentAffiliateProgram,
                value: currentAffiliateProgramValue
              }
            ]
          : affiliatePrograms;

      console.log('allAffiliatePrograms', allAffiliatePrograms);

      setLoading(true);

      const selectedCategoriesDbFromat = await NodeService.transformCategories(
        selectedCategoriesKeys,
        [],
        allCategories
      );

      try {
        // add other data to the database
        const response = await fetch('/api/deal-subscription-preference', {
          method: 'PUT',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            // email: formData.email,
            phone: formData.phone,
            notificationFrequency: pushNotificationsFrequency,
            notificationChannel: pushNotificationsChannel,
            notificationAllDeals: formData.allDeals,
            categories: JSON.stringify(selectedCategoriesDbFromat),
            affiliatePrograms: JSON.stringify(allAffiliatePrograms)
          })
        });
        if (response.ok) {
          console.log('Response', response);
          setSuccess(true);
          setLoading(false);
          setFormSubmitted(true);
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
    <>
    <div className="border-b border-gray-700 pb-12">
          <h3 className="text-base font-semibold leading-7 text-white">
            Subscription Management
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            Manage your subscription, update payment methods, and view billing history.
          </p>
          <div className="mt-10">
            {subLoading ? (
              <div className="text-gray-400">Loading subscription info...</div>
            ) : subscription ? (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Status:</span>
                  <span className="text-sm font-medium text-white">{subscription.status?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Plan:</span>
                  <span className="text-sm font-medium text-white">{subscription.prices?.products?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Start Date:</span>
                  <span className="text-sm font-medium text-white">
                    {subscription.current_period_start ? new Date(subscription.current_period_start).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Max Notifications:</span>
                  <span className="text-sm font-medium text-white">
                    {subscription.prices?.products?.max_notification_limit || 'N/A'} per day
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-4 text-gray-400">No active subscription found.</div>
            )}
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={manageSubLoading}
              className={`rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 transition-all duration-200 transform hover:scale-105 flex items-center ${manageSubLoading ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
            >
              {manageSubLoading && (
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
        </div>
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="my-8 space-y-8 max-w-screen-md">
        <div className="border-b border-gray-700 pb-12">
          <h3 className="text-base font-semibold leading-7 text-white">
            Personal Information
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            Use a permanent address where you can receive mail.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium leading-6 text-gray-200"
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
                  className="block w-full rounded-lg border-0 py-3 px-4 text-white bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-gray-600 sm:text-sm sm:leading-6 transition-all duration-200"
                  placeholder="John"
                  defaultValue={firstName}
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium leading-6 text-gray-200"
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
                  className="block w-full rounded-lg border-0 py-3 px-4 text-white bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-gray-600 sm:text-sm sm:leading-6 transition-all duration-200"
                  placeholder="Doe"
                  defaultValue={lastName}
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-200"
              >
                Email address* (can not be changed)
              </label>
              <div className="mt-2">
                <input
                  {...register('email', { required: true })}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-lg border-0 py-3 px-4 text-gray-400 bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 disabled:bg-gray-800 disabled:opacity-60"
                  placeholder="john@doe.com"
                  defaultValue={email}
                  required
                  disabled
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="phone"
                className="block text-sm font-medium leading-6 text-gray-200"
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
                  className="block w-full rounded-lg border-0 py-3 px-4 text-white bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-gray-600 sm:text-sm sm:leading-6 transition-all duration-200"
                  placeholder="+491234567890"
                  defaultValue={phone}
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Please make sure your phone number starts with +49 and has no
                blank spaces.
              </p>
            </div>

            {/* <div className="sm:col-span-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Password
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
            </div> */}
          </div>
        </div>

        <div
          className="border-b border-gray-700 pb-12"
          id="affiliate-programs"
        >
          <h3 className="text-base font-semibold leading-7 text-white">
            Affiliate Programs
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            To start, all you need is an account with the Amazon Associates
            Program and/ or AWIN to monetize the links we will send you.{' '}
            <br></br> We will automatically add your account-ID to the links we
            send you, so you can post them right away.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            {affiliatePrograms.map((affiliateProgram, idx) => (
              <>
                <div className="sm:col-span-2 ">
                  <select
                    id={`affiliateProgram${idx}`}
                    name={`affiliateProgram${idx}`}
                    autoComplete="affiliateProgram"
                    className="block w-full rounded-lg border-0 py-3 px-4 text-white bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-gray-600 sm:max-w-xs sm:text-sm sm:leading-6 transition-all duration-200"
                    onChange={(e) => onChangeAffiliateProgram(e, idx)}
                    defaultValue={affiliateProgram.name}
                  >
                    <option>Amazon</option>
                    <option>AWIN</option>
                  </select>
                </div>
                <div className="sm:col-span-4 flex items-end">
                  <input
                    id={`affiliateId${idx}`}
                    name="affiliateId"
                    type="text"
                    className="block w-full rounded-lg border-0 py-3 px-4 text-white bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-gray-600 sm:text-sm sm:leading-6 transition-all duration-200"
                    defaultValue={affiliateProgram.value}
                    onChange={(e) => onChangeAffiliateProgramValue(e, idx)}
                  />
                </div>
              </>
            ))}

            {addAffiliateProgram ? (
              <div className="sm:col-span-2">
                <select
                  id="affiliateProgram"
                  name="affiliateProgram"
                  autoComplete="affiliateProgram"
                  className="block w-full rounded-lg border-0 py-3 px-4 text-white bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-gray-600 sm:max-w-xs sm:text-sm sm:leading-6 transition-all duration-200"
                  onChange={(e) => onChangeAffiliateProgram(e, -1)}
                >
                  <option>Amazon</option>
                  <option>AWIN</option>
                </select>
              </div>
            ) : (
              <div className="sm:col-span-1 items-end flex">
                <button
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-sm font-semibold text-white shadow-lg hover:from-blue-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={() => setAddAffiliateProgram(true)}
                >
                  <PlusIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            )}

            {addAffiliateProgram && currentAffiliateProgram == 'Amazon' ? (
              <>
                <div className="sm:col-span-4 flex items-end">
                  <input
                    ref={amazonAffiliateIdRef}
                    id="affiliateIdAmazon"
                    name="affiliateIdAmazon"
                    type="text"
                    placeholder="Affiliate ID"
                    className={cn(
                      'block w-full rounded-lg border-0 py-3 px-4 text-white bg-gray-700 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-gray-600 sm:text-sm sm:leading-6 transition-all duration-200',
                      noAffiliatePrograms ? 'ring-red-500' : 'ring-gray-600'
                    )}
                    onChange={(e) => {
                      setCurrentAffiliateProgramValue(e.target.value);
                    }}
                  />
                </div>
                <div className="sm:col-span-1 items-end flex">
                  <button
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-sm font-semibold text-white shadow-lg hover:from-blue-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={onAddAffiliateProgramAmazon}
                    disabled={!currentAffiliateProgramValue}
                  >
                    <PlusIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </>
            ) : null}
            {addAffiliateProgram && currentAffiliateProgram == 'AWIN' ? (
              <>
                <div className="sm:col-span-4 flex items-end">
                  <input
                    ref={awinAffiliateIdRef}
                    id="affiliateIdAwin"
                    name="affiliateIdAwin"
                    type="text"
                    placeholder="Affiliate ID"
                    className={cn(
                      'block w-full rounded-lg border-0 py-3 px-4 text-white bg-gray-700 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-gray-600 sm:text-sm sm:leading-6 transition-all duration-200',
                      noAffiliatePrograms ? 'ring-red-500' : 'ring-gray-600'
                    )}
                    onChange={(e) => {
                      setCurrentAffiliateProgramValue(e.target.value);
                    }}
                  />
                </div>
                <div className="sm:col-span-1 items-end flex">
                  <button
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-sm font-semibold text-white shadow-lg hover:from-blue-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4 mt-6 backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className="h-5 w-5 text-red-400"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">
                    There were an error with your submission
                  </h3>
                  <div className="mt-2 text-sm text-red-300">
                    <p>It is required to add at least one affiliate ID.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-700 pb-12" id="categories">
          <h3 className="text-base font-semibold leading-7 text-white">
            Category and Brand Preferences
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            Select the categories and brands you are interested in.
          </p>

          <p className="text-sm font-semibold leading-6 text-white mt-10">
            Categories and Brands
          </p>
          <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="card flex justify-content-center w-100 col-span-full">
              {loadingCategories ? (
                <div className="h-12 rounded-lg border border-gray-600 bg-gray-700 w-full flex justify-start items-center">
                  <svg
                    className="animate-spin ml-4 h-5 w-5 text-blue-500"
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
                </div>
              ) : (
                <TreeSelect
                  value={selectedCategoriesKeys}
                  onChange={(e) => {
                    setSelectedCategoriesKeys(e.value);
                  }}
                  options={allCategories}
                  metaKeySelection={false}
                  className="md:w-20rem w-full border border-gray-600 bg-gray-700 text-white rounded-lg"
                  selectionMode="checkbox"
                  placeholder="Select Categories and Brands"
                  filter
                  required
                />
              )}
              {/* <TreeSelect
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
                placeholder="Select Categories and Brands"
                filter
              /> */}
            </div>
          </div>
          {noCategories && (
            <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4 mt-6 backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className="h-5 w-5 text-red-400"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">
                    There were an error with your submission
                  </h3>
                  <div className="mt-2 text-sm text-red-300">
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

        <div className="border-b border-gray-700 pb-12">
          <h3 className="text-base font-semibold leading-7 text-white">
            Notifications
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            Set your notifications preferences.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-white">
                Frequency
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-300">
                How many deal notifications do you want to receive per day?
                {subscription?.prices?.products?.max_notification_limit && (
                  <span className="block mt-1 text-xs text-blue-400">
                    Your {subscription.prices.products.name} plan allows up to {subscription.prices.products.max_notification_limit} notifications per day.
                  </span>
                )}
              </p>
              <div className="relative my-6 mb-2">
                <span className="text-xl text-white">
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
                  min="1"
                  max={maxDeals}
                  defaultValue={notificationFrequency}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:ring-blue-500 focus:ring-1 accent-blue-500"
                  onChange={(e) =>
                    onPushNotificationsFrequencyChange(e.target.value)
                  }
                />
                <span className="text-sm text-gray-400 absolute start-0 -bottom-6">
                  ~ 1 per Day
                </span>
                <span className="text-sm text-gray-400 absolute end-0 -bottom-6">
                  ~ {maxDeals} per Day
                </span>
              </div>
            </fieldset>

            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-white">
                Channel
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-300">
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
                    className="h-4 w-4 border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
                    checked={pushNotificationsChannel === 'whatsapp'}
                    onChange={() =>
                      onPushNotificationsChannelChange('whatsapp')
                    }
                    defaultChecked={notificationChannel === 'whatsapp'}
                  />
                  <label
                    htmlFor="pushWhatsapp"
                    className="block text-sm font-medium leading-6 text-white"
                  >
                    WhatsApp
                  </label>
                </div>
                <div className="flex items-center gap-x-3">
                  <input
                    id="pushEmail"
                    name="push-notifications-channel"
                    type="radio"
                    className="h-4 w-4 border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700 disabled:opacity-50"
                    checked={pushNotificationsChannel === 'email'}
                    onChange={() => onPushNotificationsChannelChange('email')}
                    disabled
                    defaultChecked={notificationChannel === 'email'}
                  />
                  <label
                    htmlFor="pushEmail"
                    className="block text-sm font-medium leading-6 text-gray-400"
                  >
                    Email
                  </label>
                </div>
              </div>
            </fieldset>

            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-white">
                All Deals
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-300">
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
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                      defaultChecked={notificationAllDeals}
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label
                      htmlFor="allDeals"
                      className="font-medium text-white"
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
          <p className="mt-1 leading-6 text-gray-300">
            By using our service you agree to the{' '}
            <a href="/service-agreement" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
              Closed Beta Service Agreement
            </a>
            .
          </p>
        </div>

        {formSubmitted && !success && (
          <div className="block my-6">
            <div
              className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg relative backdrop-blur-sm"
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
              className="bg-green-900/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg relative backdrop-blur-sm"
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
            className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 transition-all duration-200 transform hover:scale-105 flex disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
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
                  stroke-width="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            Save Settings
          </button>
        </div>

        <div>
          <p className="mt-6 text leading-6 text-gray-300">
            Thanks so much for helping to improve our service.
          </p>
          <p className="mt-6 text leading-6 text-gray-300">
            Please send any feedback to:{' '}
            <a href="mailto:team@omg-ecom.com" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
              team@omg-ecom.com
            </a>
          </p>
          <p className="mt-6 text leading-6 text-gray-300">Have a nice day.</p>
        </div>
      </div>
    </form>
    </>
  );
};

export default FilterForm;
