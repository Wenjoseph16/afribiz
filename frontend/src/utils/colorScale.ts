/* Génération d'une palette Tailwind-like (50→950) à partir d'une couleur de base.
   Utilisé par le moteur de thème vitrine pour décliner la couleur primaire
   du business en triplets RGB consommés par les classes brand-*. */

type Shade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

export type BrandScale = Record<Shade, string>;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToTriplet(h: number, s: number, l: number): string {
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const ln = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = ln - c / 2;
  const to255 = (v: number) => Math.round(v * 255);
  return `${to255(r + m)} ${to255(g + m)} ${to255(b + m)}`;
}

/** Génère la palette complète en triplets RGB ("R G B"), 600 = couleur de base. */
export function generateBrandScale(primaryHex: string): BrandScale {
  const { r, g, b } = hexToRgb(primaryHex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const sat = Math.min(90, Math.max(35, s));
  return {
    '50': hslToTriplet(h, sat * 0.9, 96),
    '100': hslToTriplet(h, sat * 0.92, 91),
    '200': hslToTriplet(h, sat * 0.95, 82),
    '300': hslToTriplet(h, sat, 70),
    '400': hslToTriplet(h, sat, 57),
    '500': hslToTriplet(h, sat, l > 55 ? l - 5 : l),
    '600': `${r} ${g} ${b}`,
    '700': hslToTriplet(h, sat, Math.max(20, l - 11)),
    '800': hslToTriplet(h, sat, Math.max(16, l - 17)),
    '900': hslToTriplet(h, sat, Math.max(12, l - 23)),
    '950': hslToTriplet(h, sat, Math.max(8, l - 29)),
  };
}

/** Texte lisible sur fond de couleur donnée. */
export function readableTextColor(hex: string): '#ffffff' | '#0f172a' {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0f172a' : '#ffffff';
}
