/**
 * Frontend utility functions
 */

export const classNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('en-US');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).concat('...');
};

export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generateGradient = (color1: string, color2: string): string => {
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function getBusinessTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    RESTAURANT: 'Restaurant',
    HOTEL: 'Hôtel',
    BOUTIQUE: 'Boutique',
    SERVICE: 'Service',
    FREELANCE: 'Freelance',
    ARTISAN: 'Artisan',
    AGENCY: 'Agence',
    CABINET: 'Cabinet',
    TRAINING_CENTER: 'Centre de Formation',
    RENTAL: 'Location',
    EVENT: 'Événementiel',
    ENTERPRISE: 'Entreprise',
  };
  return labels[type] || type;
}

export function formatPrice(price: number, currency: string = 'FCFA'): string {
  return `${price.toLocaleString('fr-FR')} ${currency}`;
}

export function getDayLabel(day: number): string {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[day] || '';
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
