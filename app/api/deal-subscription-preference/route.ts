import { Database } from '@/types_db';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { parse } from 'url';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  if (req.method === 'POST') {
    try {
      // 1. Get the user from Supabase auth
      const supabase = createRouteHandlerClient<Database>({ cookies });
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        return new Response('Unauthorized', {
          status: 401
        });
      }

      // 2. Retrieve data from the request body
      const {
        name,
        country,
        minScore,
        delay,
        priceError,
        merchants,
        categories,
        brands,
        cadence,
        incrementalOnly,
        whatsappNotificationReport,
        whatsappNotificationSingleDeals
      } = await req.json();
      const jsonMerchants = JSON.parse(merchants);
      const jsonCategories = JSON.parse(categories);
      const jsonBrands = JSON.parse(brands);

      // 3. insert data into the database
      // @ts-ignore
      const { data, error } = await supabase.rpc('upsert_sub_pref', {
        pref_id: -1,
        user_id: user.id,
        pref_name: name,
        pref_country: country,
        pref_min_score: minScore,
        pref_delay: delay,
        pref_price_error: priceError,
        pref_cadence: cadence,
        pref_incremental: incrementalOnly,
        pref_whatsapp_notification_report: whatsappNotificationReport,
        pref_whatsapp_notification_single_deals:
          whatsappNotificationSingleDeals,
        merchant_ids: jsonMerchants.map((merchant: any) => merchant.id),
        category_ids: jsonCategories.map((category: any) => category.id),
        brand_ids: jsonBrands.map((brand: any) => brand.id)
      });

      if (error) throw error;

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

export async function GET(req: Request) {
  if (req.method === 'GET') {
    try {
      // 1. Get the user from Supabase auth
      const supabase = createRouteHandlerClient<Database>({ cookies });
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        return new Response('Unauthorized', {
          status: 401
        });
      }

      // 2. Get all deal filter from the database
      const resultAllPreferences = await supabaseAdmin
        .from('deal_filter')
        .select()
        .eq('user', user.id)
        .order('created_at', { ascending: false });

      if (resultAllPreferences.error) throw resultAllPreferences.error;

      return new Response(JSON.stringify({ resultAllPreferences }), {
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
      headers: { Allow: 'GET' },
      status: 405
    });
  }
}

export async function PUT(req: Request) {
  console.log('PUT called');
  if (req.method === 'PUT') {
    try {
      // 1. Get the user from Supabase auth
      const supabase = createRouteHandlerClient<Database>({ cookies });
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        return new Response('Unauthorized', {
          status: 401
        });
      }

      // 2. Retrieve data from the request body
      const {
        firstName,
        lastName,
        phone,
        notificationFrequency,
        notificationChannel,
        notificationAllDeals,
        categories,
        affiliatePrograms
      } = await req.json();
      const jsonCategories = JSON.parse(categories);
      const jsonAffiliatePrograms = JSON.parse(affiliatePrograms);

      console.log('firstName', firstName);
      console.log('lastName', lastName);
      console.log('phone', phone);
      console.log('notificationFrequency', notificationFrequency);
      console.log('notificationChannel', notificationChannel);
      console.log('notificationAllDeals', notificationAllDeals);

      console.log('jsonCategories', jsonCategories);
      console.log('jsonAffiliatePrograms', jsonAffiliatePrograms);
      console.log('user_id', user.id);

      // 2. Update preference
      // @ts-ignore
      const { data, error } = await supabase.rpc('upsert_tgd_settings_test_2', {
        user_id: user.id,
        user_first_name: firstName,
        user_last_name: lastName,
        user_phone: phone,
        user_push_notification_channel: notificationChannel,
        user_notification_limit_per_day: notificationFrequency,
        user_push_notification_all_deals: notificationAllDeals
      });

      if (error) throw error;

      console.log('data', data);

      // // 2. Update preference
      // // @ts-ignore
      // const { data, error } = await supabase.rpc('upsert_sub_pref', {
      //   pref_id: id,
      //   user_id: user.id,
      //   pref_name: name,
      //   pref_country: country,
      //   pref_min_score: minScore,
      //   pref_delay: delay,
      //   pref_price_error: priceError,
      //   pref_cadence: cadence,
      //   pref_incremental: incrementalOnly,
      //   pref_whatsapp_notification_report: whatsappNotificationReport,
      //   pref_whatsapp_notification_single_deals:
      //     whatsappNotificationSingleDeals,
      //   merchant_ids: jsonMerchants.map((merchant: any) => merchant.id),
      //   category_ids: jsonCategories.map((category: any) => category.id),
      //   brand_ids: jsonBrands.map((brand: any) => brand.id)
      // });

      // if (error) throw error;

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
      headers: { Allow: 'PUT' },
      status: 405
    });
  }
}
