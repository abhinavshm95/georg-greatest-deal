'use client';

import { useSupabase } from '@/app/supabase-provider';
import { getURL } from '@/utils/helpers';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function AuthUI() {
  const { supabase } = useSupabase();
  return (
    <div className="flex flex-col space-y-6">
      <Auth
        supabaseClient={supabase}
        providers={[]}
        redirectTo={`${getURL()}/auth/callback`}
        // magicLink={true}
        appearance={{
          extend: false,
          className: {
            container: 'flex gap-6 flex-col',
            label: 'block text-sm font-semibold leading-6 text-gray-200 mb-3',
            input:
              'block w-full rounded-lg border-0 py-4 px-5 text-gray-900 bg-gray-100 ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white focus:border-transparent text-base transition-all duration-200 hover:bg-gray-50',
            button:
              'rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:from-blue-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 transition-all duration-200 transform hover:scale-105 w-full',
            divider: 'border border-gray-600 my-6',
            message: 'text-sm bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg mt-4 block backdrop-blur-sm',
            anchor: 'text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium text-sm underline underline-offset-2',
            loader: 'text-blue-400'
          },
          variables: {
            default: {
              colors: {
                inputText: '#1f2937',
                inputLabelText: '#e5e7eb',
                inputPlaceholder: '#6b7280',
                messageText: '#fca5a5',
                anchorTextColor: '#60a5fa',
                anchorTextHoverColor: '#93c5fd',
                dividerBackground: '#4b5563',
                loaderColor: '#60a5fa'
              }
            }
          }
        }}
      />
    </div>
  );
}
