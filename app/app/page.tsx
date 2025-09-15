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
        <h1 className="text-4xl my-8">
          CLOSED BETA – PRIVILEGED AND CONFIDENTIAL
        </h1>
        <p className="mb-6 text-gray-600">
          Welcome to the closed beta of the greatest deals! Our service makes it
          easy for you to monetize your content via affiliate marketing.
        </p>
        <h2 className="text-2xl mb-4">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 mb-6 gap-6">
          <div className="col-span-1 bg-primary-50 p-6 lg:p-8 lg:pb-10 rounded-lg flex flex-col md:justify-between gap-6">
            <FireIcon className="h-10 w-10 bg-primary-600 text-white p-2 rounded-lg shrink-0" />
            <div className="md:mt-3">
              <h3 className="text-lg font-semibold">Step 1</h3>
              <p className="text-gray-600">
                Our AI-driven algorithms will find trending, fast-selling
                products for you, based on your preferences.
              </p>
            </div>
          </div>
          <div className="col-span-1 bg-primary-50 p-6 lg:p-8 lg:pb-10 rounded-lg flex flex-col md:justify-between gap-6">
            <LinkIcon className="h-10 w-10 bg-primary-600 text-white p-2 rounded-lg shrink-0" />
            <div className="md:mt-3">
              <h3 className="text-lg font-semibold">Step 2</h3>
              <p className="text-gray-600">
                We send tailormade links containing your personal affiliate info
                to you in real-time using WhatsApp.
              </p>
            </div>
          </div>
          <div className="col-span-1 bg-primary-50 p-6 lg:p-8 lg:pb-10 rounded-lg flex flex-col md:justify-between gap-6">
            <CurrencyEuroIcon className="h-10 w-10 bg-primary-600 text-white p-2 rounded-lg shrink-0" />
            <div className="">
              <h3 className="text-lg font-semibold">Step 3</h3>
              <p className="text-gray-600">
                You post these links into your social accounts and start making
                money today.
              </p>
            </div>
          </div>
        </div>
        <p className="text-gray-600">
          Got it? Ok, then move on to our super-simple sign-up process…
        </p>
        <h2 className="text-2xl my-8">Sign up</h2>
        <RegisterForm products={products} />
      </div>
    </section>
  );
}