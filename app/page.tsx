'use client';

import { useEffect } from 'react';

export default function RedirectPage() {
  useEffect(() => {
    window.location.href = 'https://georgwolf2.wixstudio.com/viralink';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-gray-600 mb-4">Redirecting to ViraLink...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    </div>
  );
}