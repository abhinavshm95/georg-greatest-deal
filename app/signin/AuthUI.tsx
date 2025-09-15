'use client';

import { useState } from 'react';
import { useSupabase } from '@/app/supabase-provider';
import Link from 'next/link';

type ViewType = 'sign_in' | 'forgotten_password';

export default function AuthUI() {
  const { supabase } = useSupabase();
  const [view, setView] = useState<ViewType>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/signin`,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Check your email for the password reset link');
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchToForgotPassword = () => {
    setView('forgotten_password');
    setPassword('');
    setMessage('');
  };

  const switchToSignIn = () => {
    setView('sign_in');
    setMessage('');
  };

  const inputClassName = "block w-full rounded-lg border-0 py-4 px-5 text-gray-900 bg-gray-100 ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white focus:border-transparent text-base transition-all duration-200 hover:bg-gray-50";

  const buttonClassName = "rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:from-blue-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 transition-all duration-200 transform hover:scale-105 w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const linkClassName = "text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium text-sm underline underline-offset-2 focus:outline-none focus:ring-0 focus:ring-transparent focus:border-transparent outline-none";

  if (view === 'forgotten_password') {
    return (
      <div className="flex flex-col space-y-6">
        <form onSubmit={handleForgotPassword} className="flex gap-6 flex-col">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-200 mb-3">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClassName}
              placeholder="Your email address"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={buttonClassName}
          >
            {loading ? 'Sending...' : 'Send reset password instructions'}
          </button>
        </form>

        {message && (
          <div className="text-sm bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg mt-4 block backdrop-blur-sm">
            {message}
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={switchToSignIn}
            className={linkClassName}
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <form onSubmit={handleSignIn} className="flex gap-6 flex-col">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-200 mb-3">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClassName}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold leading-6 text-gray-200 mb-3">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClassName}
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={buttonClassName}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {message && (
        <div className="text-sm bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg mt-4 block backdrop-blur-sm">
          {message}
        </div>
      )}

      <div className="text-center space-y-4">
        <button
          type="button"
          onClick={switchToForgotPassword}
          className={linkClassName}
        >
          Forgot your password?
        </button>

        <div>
          <Link
            href="/signup"
            className={linkClassName}
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}