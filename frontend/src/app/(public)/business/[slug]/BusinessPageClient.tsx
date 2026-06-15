'use client';

import { BusinessPage } from '@/components/business-public/BusinessPage';

export function BusinessPageClient({ slug }: { slug: string }) {
  return <BusinessPage slug={slug} />;
}
