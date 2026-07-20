'use client';

import { BusinessPage } from '@/components/business-public/BusinessPage';

interface BusinessPageClientProps {
  slug: string;
  initialData?: unknown;
}

export function BusinessPageClient({ slug, initialData }: BusinessPageClientProps) {
  return <BusinessPage slug={slug} initialData={initialData} />;
}
