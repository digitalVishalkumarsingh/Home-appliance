/**
 * Production-safe logging utility
 * Reduces console output in production while maintaining error tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class ProductionLogger {
  private isProduction = process.env.NODE_ENV === 'production';
  private isDevelopment = process.env.NODE_ENV === 'development';

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data && Object.keys(data).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    
    return `${prefix} ${message}`;
  }

  debug(message: string, data?: LogData): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: LogData): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: LogData): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, data?: LogData): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  // Special method for API responses (only in development)
  apiResponse(endpoint: string, status: number, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[API] ${endpoint} - ${status}`, data ? { data } : '');
    }
  }

  // Special method for database operations (only in development)
  database(operation: string, collection?: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.log(`[DB] ${operation}${collection ? ` - ${collection}` : ''}`, data || '');
    }
  }

  // Special method for authentication (only log errors in production)
  auth(message: string, data?: LogData, isError = false): void {
    if (isError || this.isDevelopment) {
      const level = isError ? 'error' : 'info';
      console[level](this.formatMessage(level, `[AUTH] ${message}`, data));
    }
  }
}

// Export singleton instance
export const productionLogger = new ProductionLogger();

// Export helper functions for easy migration
export const logDebug = (message: string, data?: LogData) => productionLogger.debug(message, data);
export const logInfo = (message: string, data?: LogData) => productionLogger.info(message, data);
export const logWarn = (message: string, data?: LogData) => productionLogger.warn(message, data);
export const logError = (message: string, data?: LogData) => productionLogger.error(message, data);
export const logApi = (endpoint: string, status: number, data?: any) => productionLogger.apiResponse(endpoint, status, data);
export const logDb = (operation: string, collection?: string, data?: LogData) => productionLogger.database(operation, collection, data);
export const logAuth = (message: string, data?: LogData, isError = false) => productionLogger.auth(message, data, isError);
