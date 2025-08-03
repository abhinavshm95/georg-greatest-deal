import { Database } from '@/types_db';
import { createClient } from '@supabase/supabase-js';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// this function returns all categories that are subscribable from the database
export async function GET(req: Request) {
  if (req.method === 'GET') {
    try {
      const res12 = await supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'in', '(1, 2)')
        .order('name', { ascending: true });

      if (res12.error) throw res12.error;

      const res3 = await supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'eq', 3)
        .order('name', { ascending: true });

      if (res3.error) throw res3.error;

      const res4 = await supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'eq', 4)
        .order('name', { ascending: true });

      if (res4.error) throw res4.error;

      const res567 = await supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'in', '(5, 6, 7)')
        .order('name', { ascending: true });

      if (res567.error) throw res567.error;

      const res = res12.data.concat(res3.data, res4.data, res567.data);

      return new Response(JSON.stringify({ res }), {
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
