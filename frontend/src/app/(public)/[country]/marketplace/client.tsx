'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import MarketplaceContent from '@/components/marketplace/MarketplaceContent';

const COUNTRY_NAMES: Record<string, string> = {
  TG: 'Togo',
  BJ: 'Bénin',
  GH: 'Ghana',
  CI: "Côte d'Ivoire",
  BF: 'Burkina Faso',
  SN: 'Sénégal',
};

const COUNTRY_FLAGS: Record<string, string> = {
  TG: '\uD83C\uDDF9\uD83C\uDDF1',
  BJ: '\uD83C\uDDE7\uD83C\uDDEF',
  GH: '\uD83C\uDDEC\uD83C\uDDED',
  CI: '\uD83C\uDDE8\uD83C\uDDEE',
  BF: '\uD83C\uDDE7\uD83C\uDDEB',
  SN: '\uD83C\uDDF8\uD83C\uDDF3',
};

export default function CountryMarketplaceClient({ countryCode }: { countryCode: string }) {
  const name = COUNTRY_NAMES[countryCode] || countryCode;
  const flag = COUNTRY_FLAGS[countryCode] || '';

  return (
    <>
      <Header />
      <main className="pt-16">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-900">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
              {flag && <span className="text-lg">{flag}</span>}
              <span>Pays : {name}</span>
            </div>
            <Link
              href="/marketplace"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors"
            >
              Tous les pays
            </Link>
          </div>
        </div>
        <MarketplaceContent initialCountry={countryCode} />
      </main>
      <Footer />
    </>
  );
}
