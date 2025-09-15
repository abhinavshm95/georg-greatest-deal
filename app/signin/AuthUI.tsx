'use client';

import { useSupabase } from '@/app/supabase-provider';
import { getURL } from '@/utils/helpers';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function AuthUI() {
  const { supabase } = useSupabase();
  return (
    <div className="flex flex-col space-y-4">
      <Auth
        supabaseClient={supabase}
        providers={[]}
        redirectTo={`${getURL()}/auth/callback`}
        // magicLink={true}
        appearance={{
          extend: false,
          className: {
            container: 'flex gap-4 flex-col',
            label: 'block text-sm font-medium leading-6 text-gray-900',
            input:
              'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6',
            button:
              'rounded-md bg-primary-600 px-8 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
            divider: 'border border-gray-300 my-4',
            message: 'text-sm bg-red-100 p-4 rounded-md mt-4 block'
          }
        }}
      />
    </div>
  );
}
