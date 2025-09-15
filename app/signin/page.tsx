import AuthUI from './AuthUI';
import { getSession } from '@/app/supabase-server';
import Logo from '@/components/icons/Logo';
import { redirect } from 'next/navigation';
import Footer from '@/components/ui/Footer';

export default async function SignIn() {
  const session = await getSession();

  if (session) {
    return redirect('/tgd/settings');
  }

  return (
    <div className="min-h-screen bg-vira-dark flex flex-col justify-between w-screen">
      <div className="flex justify-center my-auto">
        <div className="bg-vira-card rounded-3xl shadow-2xl border border-gray-800 p-12 max-w-lg w-full mx-6">
          <div className="flex justify-center pb-8">
            <Logo width="64px" height="64px" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-8 text-white">Welcome Back</h1>
          <p className="text-gray-300 text-center mb-8">Sign in to your account to continue</p>
          <AuthUI />
        </div>
      </div>
      <Footer />
    </div>
  );
}
