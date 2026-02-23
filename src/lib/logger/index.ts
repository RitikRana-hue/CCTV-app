import { LogEntry } from '@/types';
import config from '../config';

class Logger {
  private logLevel: LogEntry['level'] = config.logging.level;

  private shouldLog(level: LogEntry['level']): boolean {
    const levels: Record<LogEntry['level'], number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
    const userId = entry.userId ? ` | User: ${entry.userId}` : '';
    const cameraId = entry.cameraId ? ` | Camera: ${entry.cameraId}` : '';
    
    return `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${context}${userId}${cameraId}`;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = this.formatMessage(entry);
    
    // Console output
    switch (entry.level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }

    // File logging (in production, you'd want to use a proper logging library)
    if (typeof window === 'undefined' && config.logging.level !== 'debug') {
      // In a real implementation, you'd write to a file
      // For now, we'll just keep it in memory or use a logging service
    }
  }

  debug(message: string, context?: any, userId?: string, cameraId?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: 'debug',
      message,
      context,
      userId,
      cameraId,
    });
  }

  info(message: string, context?: any, userId?: string, cameraId?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: 'info',
      message,
      context,
      userId,
      cameraId,
    });
  }

  warn(message: string, context?: any, userId?: string, cameraId?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: 'warn',
      message,
      context,
      userId,
      cameraId,
    });
  }

  error(message: string, context?: any, userId?: string, cameraId?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: 'error',
      message,
      context,
      userId,
      cameraId,
    });
  }

  setLogLevel(level: LogEntry['level']): void {
    this.logLevel = level;
  }
}

export const logger = new Logger();
export default logger;
