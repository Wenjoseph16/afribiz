import './globals.css';
import { Providers } from '@/components/providers';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AfriBiz - African SaaS Marketplace',
  description: 'Manage your business, sell products, and grow with AfriBiz',
  keywords: ['African marketplace', 'SaaS', 'e-commerce', 'business management'],
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon-192.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            try {
              var theme = localStorage.getItem('afribiz-theme');
              if (!theme) {
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          `,
          }}
        />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
