'use client';

import { CSSProperties, useMemo } from 'react';
import type { Business, BusinessTheme } from '@afribiz/shared';
import { generateBrandScale } from '@/utils/colorScale';

/* ─── Thème par défaut (identique aux valeurs du validateur backend) ─── */
export const DEFAULT_BIZ_THEME: Required<Omit<BusinessTheme, 'sectionVisibility'>> = {
  primaryColor: '#059669',
  backgroundColor: '',
  borderRadius: 'md',
  fontFamily: 'inter',
  enableAnimations: true,
  layout: 'standard',
};

const FONT_STACKS: Record<string, string> = {
  inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  geist: "'Geist', 'Inter', ui-sans-serif, system-ui, sans-serif",
  system:
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export interface ResolvedBizTheme {
  theme: Required<Omit<BusinessTheme, 'sectionVisibility'>> & {
    sectionVisibility: Record<string, boolean>;
  };
  style: CSSProperties;
  dataAttrs: {
    'data-biz-theme': string;
    'data-biz-layout': string;
    'data-biz-anim': string;
    'data-biz-radius': string;
  };
}

/** Fusionne le thème du business avec les défauts et produit style + data-attrs. */
export function useBizTheme(businessTheme?: BusinessTheme | null): ResolvedBizTheme {
  return useMemo(() => {
    const t = businessTheme || {};
    const primary = /^#[0-9a-fA-F]{6}$/.test(t.primaryColor || '')
      ? (t.primaryColor as string)
      : DEFAULT_BIZ_THEME.primaryColor;
    const bg = /^#[0-9a-fA-F]{6}$/.test(t.backgroundColor || '') ? t.backgroundColor! : '#ffffff';
    const fontFamily = FONT_STACKS[t.fontFamily || 'inter'] || FONT_STACKS.inter;

    const scale = generateBrandScale(primary);
    const vars: Record<string, string> = {};
    (Object.entries(scale) as [string, string][]).forEach(([shade, triplet]) => {
      vars[`--biz-brand-${shade}`] = triplet;
    });

    const style = {
      ...vars,
      fontFamily,
      ...(bg ? { backgroundColor: bg } : {}),
    } as CSSProperties;

    return {
      theme: {
        primaryColor: primary,
        backgroundColor: bg,
        borderRadius: t.borderRadius || DEFAULT_BIZ_THEME.borderRadius,
        fontFamily: t.fontFamily || 'inter',
        enableAnimations: t.enableAnimations !== false,
        layout: t.layout || 'standard',
        sectionVisibility: t.sectionVisibility || {},
      },
      style,
      dataAttrs: {
        'data-biz-theme': 'on',
        'data-biz-layout': t.layout || 'standard',
        'data-biz-anim': t.enableAnimations === false ? 'off' : 'on',
        'data-biz-radius': t.borderRadius || 'md',
      },
    };
  }, [businessTheme]);
}

/** Visibilité d'une section (défaut : visible). */
export function isSectionVisible(
  visibility: Record<string, boolean> | undefined,
  key: string
): boolean {
  return !visibility || visibility[key] !== false;
}
