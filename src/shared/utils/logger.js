/**
 * Simple structured logger for the MCP server
 */
export class Logger {
  constructor(context = 'MetabaseMCP') {
    this.context = context;
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  /**
   * Log levels in order of severity
   */
  static LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  /**
   * Check if a log level should be logged
   */
  shouldLog(level) {
    const currentLevel = Logger.LEVELS[this.logLevel] || Logger.LEVELS.info;
    const messageLevel = Logger.LEVELS[level] || Logger.LEVELS.info;
    return messageLevel >= currentLevel;
  }

  /**
   * Format and output a log entry
   */
  log(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context: this.context,
      message,
      ...meta,
    };
    
    // Use console.error for all logs to avoid interfering with MCP stdio
    console.error(JSON.stringify(logEntry));
  }

  /**
   * Debug level logging
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      this.log('debug', message, meta);
    }
  }

  /**
   * Info level logging
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      this.log('info', message, meta);
    }
  }

  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      this.log('warn', message, meta);
    }
  }

  /**
   * Error level logging
   */
  error(message, error = null, meta = {}) {
    if (this.shouldLog('error')) {
      const errorMeta = error ? {
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
      } : {};
      
      this.log('error', message, { ...meta, ...errorMeta });
    }
  }

  /**
   * Create a child logger with a different context
   */
  child(context) {
    return new Logger(`${this.context}:${context}`);
  }
}

// Export a default logger instance
export const logger = new Logger();

