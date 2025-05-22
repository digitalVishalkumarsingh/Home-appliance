// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Simple logger configuration with browser compatibility
export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    try {
      console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    } catch (error) {
      console.log(`[INFO] ${message}`);
    }
  },
  warn: (message: string, meta?: Record<string, any>) => {
    try {
      console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
    } catch (error) {
      console.warn(`[WARN] ${message}`);
    }
  },
  error: (message: string, meta?: Record<string, any>) => {
    try {
      console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
    } catch (error) {
      console.error(`[ERROR] ${message}`);
    }
  },
  debug: (message: string, meta?: Record<string, any>) => {
    // In browser, we can't reliably check NODE_ENV, so we'll check for development mode differently
    const isDevelopment = !isBrowser ||
      (isBrowser && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      ));

    if (isDevelopment) {
      try {
        console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
      } catch (error) {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  }
};