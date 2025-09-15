import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="px-6 bg-vira-dark/95 backdrop-blur-sm border-t border-gray-800/50 text-sm">
      <div className="flex flex-col items-center justify-between py-8 md:flex-row text-gray-300 max-w-7xl mx-auto">
        <div>
          <span className="text-gray-400 hover:text-gray-300 transition-colors duration-200">
            &copy; {new Date().getFullYear()} OMG E-Commerce GmbH, Inc. All
            rights reserved.
          </span>
        </div>
        <div className="flex items-center flex-col sm:flex-row mt-4 md:mt-0 gap-6">
          <Link
            href="/impressum"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-200 font-medium"
          >
            Impressum
          </Link>
          <div className="hidden sm:block w-1 h-1 bg-gray-600 rounded-full"></div>
          <Link
            href="/datenschutz"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-200 font-medium"
          >
            Datenschutzerklärung
          </Link>
          <div className="hidden sm:block w-1 h-1 bg-gray-600 rounded-full"></div>
          <Link
            href="/agb"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-200 font-medium"
          >
            AGB
          </Link>
        </div>
      </div>
    </footer>
  );
}
