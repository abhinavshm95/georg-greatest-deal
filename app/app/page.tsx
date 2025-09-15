import RegisterForm from '@/components/RegisterForm';
import {
  FireIcon,
  LinkIcon,
  CurrencyEuroIcon
} from '@heroicons/react/20/solid';
import {
  getActiveProductsWithPrices
} from '@/app/supabase-server';

// Thats the HomePage component. It is the main page of the application. It containes the sing-up form and a brief explanation of the service.
export default async function AppPage() {
  const [products] = await Promise.all([
    getActiveProductsWithPrices()
  ]);
  return (
    <section className="container mx-auto mb-20">
      <div className="max-w-screen-lg">
        <h2 className="text-2xl my-8">Sign up</h2>
        <RegisterForm products={products} />
      </div>
    </section>
  );
}