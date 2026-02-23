export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
  cameraId?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    this.logLevel = this.getLogLevelFromEnv();
    this.setupProcessHandlers();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private setupProcessHandlers(): void {
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.cleanup());
      process.on('SIGINT', () => this.cleanup());
      process.on('SIGTERM', () => this.cleanup());
    }
  }

  private cleanup(): void {
    this.info('Logger shutting down');
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level].padEnd(5);
    const cameraStr = entry.cameraId ? `[${entry.cameraId}] ` : '';
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    
    return `[${timestamp}] ${levelStr} ${cameraStr}${entry.message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: any, cameraId?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      cameraId,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    const formattedMessage = this.formatMessage(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: any, cameraId?: string): void {
    this.log(LogLevel.DEBUG, message, context, cameraId);
  }

  info(message: string, context?: any, cameraId?: string): void {
    this.log(LogLevel.INFO, message, context, cameraId);
  }

  warn(message: string, context?: any, cameraId?: string): void {
    this.log(LogLevel.WARN, message, context, cameraId);
  }

  error(message: string, context?: any, cameraId?: string): void {
    this.log(LogLevel.ERROR, message, context, cameraId);
  }

  getLogs(level?: LogLevel, cameraId?: string): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }
    
    if (cameraId) {
      filteredLogs = filteredLogs.filter(log => log.cameraId === cameraId);
    }
    
    return filteredLogs;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level set to ${LogLevel[level]}`);
  }
}

export const logger = Logger.getInstance();
