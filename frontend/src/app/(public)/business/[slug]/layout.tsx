import { ReactNode } from 'react';

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Accueil',
                item: process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Marketplace',
                item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com'}/marketplace`,
              },
              { '@type': 'ListItem', position: 3, name: 'Business' },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
