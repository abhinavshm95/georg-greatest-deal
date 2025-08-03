import { getSession, createServerSupabaseClient } from '../../supabase-server';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import FilterForm from '@/components/FilterForm';
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const PreferecesPage = async () => {
  const [session] = await Promise.all([getSession()]);

  if (!session) {
    return redirect('/signin');
  }

  const user = session.user;

  // 1.  Get user details from the database
  const resultUser = await supabaseAdmin
    .from('users')
    .select(
      'first_name, last_name, email, phone_mobile, push_notification_all_deals, push_notification_channel, notification_limit_per_day'
    )
    .eq('id', user.id)
    .single();
  if (resultUser.error) throw resultUser.error;
  const userDetails = resultUser.data;

  // 2. Get the preference from the database
  const resultPreferences = await supabaseAdmin
    .from('deal_filter')
    .select(`category (id, name, slug, level)`)
    .eq('user', user.id);

  if (resultPreferences.error) throw resultPreferences.error;

  const categories = resultPreferences.data.map((item) => ({
    ...item.category,
    // @ts-ignore
    id: String(item.category.id)
  }));

  // 3. Get the amazon affiliate programs from the database
  const resultAmazonAffiliatePrograms = await supabaseAdmin
    .from('affiliate_amazon')
    .select()
    .eq('user', user.id);
  if (resultAmazonAffiliatePrograms.error) {
    throw resultAmazonAffiliatePrograms.error;
  }
  const amazonAffiliatePrograms = resultAmazonAffiliatePrograms.data.map(
    (program) => ({
      id: program.id,
      name: 'Amazon',
      value: program.affiliate_id
    })
  );

  // 4. Get the awin affiliate programs from the database
  const resultAwinAffiliatePrograms = await supabaseAdmin
    .from('affiliate_awin')
    .select()
    .eq('user', user.id);
  if (resultAwinAffiliatePrograms.error) {
    throw resultAwinAffiliatePrograms.error;
  }

  const awinAffiliatePrograms = resultAwinAffiliatePrograms.data.map(
    (program) => ({
      id: program.id,
      name: 'Awin',
      value: program.affiliate_id
    })
  );

  return (
    <section className="container mx-auto mb-20">
      <div className="max-w-screen-lg">
        <h1 className="text-4xl my-8">Settings</h1>
        <div className="my-8 space-y-8 max-w-screen-md">
          <ManageSubscriptionButton />
          <FilterForm
            initUserDetails={{
              firstName: userDetails.first_name,
              lastName: userDetails.last_name,
              email: userDetails.email,
              phone: userDetails.phone_mobile,
              notificationFrequency: userDetails.notification_limit_per_day,
              notificationChannel: userDetails.push_notification_channel,
              notificationAllDeals: userDetails.push_notification_all_deals
            }}
            initAffiliatePrograms={amazonAffiliatePrograms.concat(
              awinAffiliatePrograms
            )}
            // @ts-ignore
            initCategories={categories}
          />
        </div>
      </div>
    </section>
  );
};

export default PreferecesPage;
