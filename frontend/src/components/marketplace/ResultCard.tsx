'use client';

import { cn } from '@/lib/utils';
import HoverCard, { BusinessHoverPreview } from '@/components/marketplace/HoverCard';
import {
  BusinessCard,
  ProductCard,
  ServiceCard,
  MenuCard,
  EventCard,
  RentalCard,
  DeveloperCard,
  ModuleCard,
} from '@/components/marketplace/cards';
import type {
  ResultItem,
  ResultType,
  BusinessResult,
  ProductResult,
  ServiceResult,
  MenuResult,
  EventResult,
  RentalResult,
  DeveloperResult,
  ModuleResult,
  ResultCardProps,
} from '@/components/marketplace/cards/types';

export default function ResultCard({ item, view = 'grid' }: ResultCardProps) {
  switch (item.type) {
    case 'business':
      return (
        <HoverCard content={<BusinessHoverPreview item={item} />} side="bottom">
          <BusinessCard item={item} view={view} />
        </HoverCard>
      );
    case 'product':
      return <ProductCard item={item} view={view} />;
    case 'service':
      return <ServiceCard item={item} view={view} />;
    case 'menu':
      return <MenuCard item={item} view={view} />;
    case 'event':
      return <EventCard item={item} view={view} />;
    case 'rental':
      return <RentalCard item={item} view={view} />;
    case 'developer':
      return <DeveloperCard item={item} view={view} />;
    case 'module':
      return <ModuleCard item={item} view={view} />;
    default:
      return null;
  }
}

export type {
  ResultItem,
  ResultType,
  BusinessResult,
  ProductResult,
  ServiceResult,
  MenuResult,
  EventResult,
  RentalResult,
  DeveloperResult,
  ModuleResult,
};
