import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="px-6 bg-indigo-900 text-sm">
      <div className="flex flex-col items-center justify-between py-6 md:flex-row text-white">
        <div>
          <span>
            &copy; {new Date().getFullYear()} OMG E-Commerce GmbH, Inc. All
            rights reserved.
          </span>
        </div>
        <div className="flex items-center flex-col sm:flex-row mt-0 gap-4">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutzerklärung</Link>
          <Link href="/agb">AGB</Link>
        </div>
      </div>
    </footer>
  );
}
