// Minimal frontend logger — silencieux en production, verbeux en développement
const isDev = process.env.NODE_ENV === 'development';

interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export const logger: Logger = {
  info: (...args) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('[AfriBiz]', ...args);
    }
  },
  warn: (...args) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn('[AfriBiz]', ...args);
    }
  },
  error: (...args) => {
    // Toujours logguer les erreurs, même en production (via console.error natif)
    // eslint-disable-next-line no-console
    console.error('[AfriBiz]', ...args);
  },
};
