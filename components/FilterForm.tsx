'use client';

import { NodeService } from '../utils/node-service';
import { useSupabase } from '@/app/supabase-provider';
import { TreeSelect, TreeSelectSelectionKeysType } from 'primereact/treeselect';
import { FormEvent, useEffect, useRef, useState } from 'react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import cn from 'classnames';
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

  // Helper to scroll to a section without changing the route
  const scrollToSection = (id: string) => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

      // scroll to affiliate programs section without route navigation
      scrollToSection('affiliate-programs');
    } else if (allCategories.length < 1) {
      // set error message
      setNoCategories(true);

      // scroll to categories section without route navigation
      scrollToSection('categories');
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

  const frequencyTiers = [
    { name: 'Basic', value: 5, id: 'basic' },
    { name: 'Growth', value: 20, id: 'growth' },
    { name: 'Pro', value: 50, id: 'pro' }
  ];

  const userMaxNotifications =
    subscription?.prices?.products?.max_notification_limit;
  const limit = userMaxNotifications ?? 5;

  return (
    <>
    <div className="border-b border-gray-700 pb-12">
          <h3 className="text-base font-semibold leading-7 text-white">
            Abonnementverwaltung
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            Verwalten Sie Ihr Abonnement, aktualisieren Sie Zahlungsmethoden und zeigen Sie den Rechnungsverlauf an.
          </p>
          <div className="mt-10">
            {subLoading ? (
              <div className="text-gray-400">Abonnementinformationen werden geladen …</div>
            ) : subscription ? (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Status:</span>
                  <span className="text-sm font-medium text-white">{subscription.status?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Planen:</span>
                  <span className="text-sm font-medium text-white">{subscription.prices?.products?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Startdatum:</span>
                  <span className="text-sm font-medium text-white">
                    {subscription.current_period_start ? new Date(subscription.current_period_start).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Maximale Benachrichtigungen:</span>
                  <span className="text-sm font-medium text-white">
                    {subscription.prices?.products?.max_notification_limit || 'N/A'} per day
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-4 text-gray-400">Kein aktives Abonnement gefunden.</div>
            )}
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={manageSubLoading || !subscription}
              className={`rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 transition-all duration-200 transform hover:scale-105 flex items-center ${(manageSubLoading || !subscription) ? 'opacity-50 cursor-not-allowed transform-none ' : ''}`}
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
              Abonnement verwalten
            </button>
          </div>
        </div>
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="my-8 space-y-8 max-w-screen-md">
        <div className="border-b border-gray-700 pb-12">
          <h3 className="text-base font-semibold leading-7 text-white">
            Persönliche Angaben
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            Verwenden Sie eine feste Adresse, an der Sie Post empfangen können.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium leading-6 text-gray-200"
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
                Nachname*
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
                E-Mail Adresse* (kann nicht geändert werden)
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
                Mobiltelefonnummer (WhatsApp)*
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
                Bitte achten Sie darauf, dass Ihre Telefonnummer mit +49 beginnt und keine Leerzeichen enthält.
              </p>
            </div>

            {/* <div className="sm:col-span-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Passwort
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
            Affiliate Programme
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            Teile uns hier Deine ID für das Affiliate Programm von Amazon oder AWIN mit. Bist Du bei beiden registriert, füge einfach ein weiteres Programm mit „+“ hinzu. Wir integrieren Deine IDs automatisch mit unseren Linkservice „Viralink“.
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
            Kategorien und Brands
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            Wähle aus, welche Kategorien oder Brands am besten zu Deiner Audience passen. Tip: Sei grosszügig bei der Auswahl, um eine angemessene Anzahl Deals zu bekommen aus denen Du dann wählen kannst. 
          </p>

          <p className="text-sm font-semibold leading-6 text-white mt-10">
            Kategorien und Brands
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
                  placeholder="Kategorien und Marken auswählen"
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
                placeholder="Kategorien und Marken auswählen"
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
              <strong className="font-bold">Erfolg</strong>
              <span className="block sm:inline pl-4">
                Sie sind erfolgreich angemeldet
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
            Einstellungen speichern
          </button>
        </div>
      </div>
    </form>
    </>
  );
};

export default FilterForm;
