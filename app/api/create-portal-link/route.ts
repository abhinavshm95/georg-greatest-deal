import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/utils/stripe';
import { createOrRetrieveCustomer } from '@/utils/supabase-admin';
import { getURL } from '@/utils/helpers';
import { Database } from '@/types_db';

export async function POST(req: Request) {
  if (req.method === 'POST') {
    try {
      const supabase = createRouteHandlerClient<Database>({cookies});
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) throw Error('Could not get user');
      const customer = await createOrRetrieveCustomer({
        uuid: user.id || '',
        email: user.email || ''
      });

      if (!customer) throw Error('Could not get customer');
      
      const { url } = await stripe.billingPortal.sessions.create({
        customer,
        return_url: `${getURL()}/account`
      });
      
      return new Response(JSON.stringify({ url }), {
        status: 200
      });
    } catch (err: any) {
      console.log(err);
      
      // Provide more specific error messages for common issues
      let errorMessage = err.message;
      if (err.message.includes('No configuration provided') || err.message.includes('default configuration has not been created')) {
        errorMessage = 'Stripe Customer Portal is not configured. Please configure it in your Stripe dashboard at https://dashboard.stripe.com/test/settings/billing/portal';
      } else if (err.message.includes('customer')) {
        errorMessage = 'Unable to create customer portal session. Please try again or contact support.';
      }
      
      return new Response(
        JSON.stringify({ error: { statusCode: 500, message: errorMessage } }),
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
