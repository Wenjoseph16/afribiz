import './globals.css';
import { Providers } from '@/components/providers';
import { PWARegister } from '@/components/PWARegister';

import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Les Providers (Socket, thème, auth) sont des composants client — pas besoin de force-dynamic
// Next.js optimise automatiquement : pages statiques si possible, dynamiques si fetch/auth

export const metadata = {
  title: { default: 'AfriBiz - Marketplace SaaS Africaine', template: '%s | AfriBiz' },
  description: 'Gérez votre business, vendez vos produits et développez votre activité avec AfriBiz, la marketplace SaaS africaine.',
  keywords: ['marketplace africaine', 'SaaS', 'e-commerce', 'gestion d\'entreprise', 'Afrique', 'business'],
  openGraph: {
    title: 'AfriBiz - Marketplace SaaS Africaine',
    description: 'Gérez votre business, vendez vos produits et développez votre activité avec AfriBiz.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com',
    siteName: 'AfriBiz',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: '/og-default.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfriBiz - Marketplace SaaS Africaine',
    description: 'Gérez votre business, vendez vos produits avec AfriBiz.',
    images: ['/og-default.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('afribiz-theme');
            var d = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', d);
          } catch(e) {}
        ` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#059669" />
      </head>
      <body className="font-sans">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-white focus:dark:bg-gray-800 focus:text-brand focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand">
          Aller au contenu principal
        </a>
        <Providers>
          <PWARegister />
          <div id="main-content">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
