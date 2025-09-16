import { Database } from '@/types_db';
import { getURL } from '@/utils/helpers';
import { stripe } from '@/utils/stripe';
import { createOrRetrieveCustomer } from '@/utils/supabase-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { Hash } from 'crypto';
import { cookies } from 'next/headers';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface IRawCategory {
  slug: string;
  level: number;
  id: string
}

interface IDBCategory {
  id: string;
  level: number;
}

export async function POST(req: Request) {
  if (req.method === 'POST') {
    try {
      const {
        userId,
        firstName,
        lastName,
        email,
        password,
        phone,
        notificationFrequency,
        notificationChannel,
        notificationAllDeals,
        categories,
        affiliatePrograms
      } = await req.json();

      const enrichedCategories = JSON.parse(categories).map((category: IRawCategory) => ({
        id: category.id,
        level: category.level
      }));

      const authUserId = userId;
      if (!authUserId) throw new Error('Failed to create user account');

      // const jsonCategories = JSON.parse(categories);
      const jsonAffiliatePrograms = JSON.parse(affiliatePrograms);

      const amazonAffiliatePrograms = jsonAffiliatePrograms.filter(
        (affiliateProgram: any) => affiliateProgram.name === 'Amazon'
      );

      const awinAffiliatePrograms = jsonAffiliatePrograms.filter(
        (affiliateProgram: any) => affiliateProgram.name === 'AWIN'
      );

      const resultUserSignup = await supabaseAdmin.from('users').upsert([
        {
          id: authUserId,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          phone_mobile: phone,
          email: email,
          notification_limit_per_day: notificationFrequency,
          push_notification_channel: notificationChannel,
          push_notification_all_deals: notificationAllDeals
        }
      ]);

      if (resultUserSignup.error) throw resultUserSignup.error;

      const resultCategoriesFilter = await supabaseAdmin
        .from('deal_filter')
        .insert(
          enrichedCategories.map((category: IDBCategory) => ({
            user: authUserId,
            min_score: null,
            category: category.id
          }))
        );

      if (resultCategoriesFilter.error) throw resultCategoriesFilter.error;

      const resultAmazonAffiliateProgram = await Promise.all(
        amazonAffiliatePrograms.map(async (affiliateProgram: any) => {
          const { data, error } = await supabaseAdmin
            .from('affiliate_amazon')
            .insert([
              {
                user: authUserId,
                affiliate_id: affiliateProgram.value
              }
            ]);

          if (error) throw error;
        })
      );

      const resultAwinAffiliateProgram = await Promise.all(
        awinAffiliatePrograms.map(async (affiliateProgram: any) => {
          const { data, error } = await supabaseAdmin
            .from('affiliate_awin')
            .insert([
              {
                user: authUserId,
                affiliate_id: affiliateProgram.value
              }
            ]);

          if (error) throw error;
        })
      );

      return new Response('ok', {
        status: 200
      });
    } catch (err: any) {
      console.log(err);
      return new Response(
        JSON.stringify({ error: { statusCode: 500, message: err.message } }),
        {
          status: 500
        }
      );
    }
  } else {
    return new Response('Method Not Allowed', {
      headers: { Allow: 'POST' },
      status: 405
    });
  }
}
