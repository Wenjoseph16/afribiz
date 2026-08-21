'use client';

import { apiClient } from '@/services/apiClient';

/** Upload un fichier via POST /upload/media et retourne son URL publique. */
export async function uploadFile(file: File): Promise<string> {
  const res = await apiClient.uploadMedia(file);
  return res.data?.data?.url || res.data?.data?.path || '';
}

/** Miroir client du calcul serveur de computeProfileStrength (services/developer.ts). */
export function computeStrength(
  data: {
    photo: string;
    companyLogo: string;
    companyName: string;
    bio: string;
    expertise: { coreStack: unknown[]; domains: string[] };
    portfolioItems: unknown[];
    certifications: unknown[];
  },
  hasIdentityDoc: boolean
): number {
  let score = 0;
  if (data.photo || data.companyLogo) score += 10;
  if (data.bio.trim().length >= 50) score += 10;
  if (data.companyName.trim().length >= 2) score += 5;
  const stack = data.expertise.coreStack.length;
  if (stack >= 3) score += 20;
  else if (stack > 0) score += 10;
  if (data.expertise.domains.length > 0) score += 10;
  if (data.portfolioItems.length > 0) score += 15;
  if (data.certifications.length > 0) score += 15;
  if (hasIdentityDoc) score += 15;
  return Math.min(100, score);
}
