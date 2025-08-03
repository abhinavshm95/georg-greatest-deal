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
    <div className="h-screen flex flex-col justify-between w-screen">
      <div className="flex justify-center my-auto">
        <div className="flex flex-col justify-between max-w-lg p-3 m-auto w-80 ">
          <h1 className="text-4xl text-center mb-8">Login</h1>
          {/* <div className="flex justify-center pb-12 ">
            <Logo width="64px" height="64px" />
          </div> */}
          <AuthUI />
        </div>
      </div>
      <Footer />
    </div>
  );
}
