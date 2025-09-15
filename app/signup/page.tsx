import RegisterForm from '@/components/RegisterForm';
import {
  FireIcon,
  LinkIcon,
  CurrencyEuroIcon
} from '@heroicons/react/20/solid';
import {
  getActiveProductsWithPrices
} from '@/app/supabase-server';
import Footer from '@/components/ui/Footer';

// Thats the HomePage component. It is the main page of the application. It containes the sing-up form and a brief explanation of the service.
export default async function AppPage() {
  const [products] = await Promise.all([
    getActiveProductsWithPrices()
  ]);
  return (
    <div className="min-h-screen bg-vira-dark flex flex-col">
      <div className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Join ViraLink
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Start your affiliate marketing journey with AI-driven deal discovery
            </p>
          </div>
          <RegisterForm products={products} />
        </div>
      </div>
      <Footer />
    </div>
  );
}