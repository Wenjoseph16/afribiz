/**
 * Media URL helper
 * - If backend returns relative paths (e.g. /uploads/xxx or uploads/xxx), convert them to absolute URLs.
 * - If backend returns absolute URLs (http/https), keep as-is.
 *
 * Configure via NEXT_PUBLIC_MEDIA_BASE_URL if you serve media from a CDN/cloud bucket.
 */

const MEDIA_BASE_URL = (
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  ''
).trim();

export function toMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  const trimmed = String(url).trim();
  if (!trimmed) return undefined;

  // Absolute URL (http/https)
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Protocol-relative URL
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;

  // Root-relative path
  if (trimmed.startsWith('/')) {
    if (MEDIA_BASE_URL) return MEDIA_BASE_URL.replace(/\/$/, '') + trimmed;
    return trimmed; // fallback: relative to current domain
  }

  // Relative path without leading slash
  if (MEDIA_BASE_URL) {
    return MEDIA_BASE_URL.replace(/\/$/, '') + '/' + trimmed;
  }

  return trimmed;
}
