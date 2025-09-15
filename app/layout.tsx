import SupabaseProvider from './supabase-provider';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { PropsWithChildren } from 'react';
import { Sora } from 'next/font/google';
import 'styles/main.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});

const meta = {
  title: 'The Greatest Deals',
  description: '',
  url: 'https://thegreatest.deals/',
  type: 'website'
};

export const metadata = {
  title: meta.title,
  description: meta.description,
  url: meta.url,
  type: meta.type,
  openGraph: {
    url: meta.url,
    title: meta.title,
    description: meta.description,
    type: meta.type,
    site_name: meta.title
  }
};

// this is the layout for the entire app. It will wrap all pages. It containes the Footer and the main content.
export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children
}: PropsWithChildren) {
  return (
    <html lang="en">
      <body className={`loading bg-white ${sora.variable} font-sora`}>
        <SupabaseProvider>
          {/* <Navbar /> */}
          <main
            id="skip"
            className="min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]"
          >
            {children}
          </main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
