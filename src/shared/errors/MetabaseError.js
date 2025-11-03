/**
 * Base error class for Metabase MCP Server
 */
export class MetabaseError extends Error {
  constructor(message, code = 'METABASE_ERROR', details = {}) {
    super(message);
    this.name = 'MetabaseError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * API-related errors (network, HTTP errors, etc.)
 */
export class ApiError extends MetabaseError {
  constructor(message, statusCode, endpoint, responseText = '') {
    super(message, 'API_ERROR', { statusCode, endpoint, responseText });
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.responseText = responseText;
  }
}

/**
 * Validation errors (invalid input parameters)
 */
export class ValidationError extends MetabaseError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Configuration errors (missing env vars, invalid config)
 */
export class ConfigurationError extends MetabaseError {
  constructor(message, configKey) {
    super(message, 'CONFIGURATION_ERROR', { configKey });
    this.name = 'ConfigurationError';
    this.configKey = configKey;
  }
}

/**
 * Tool execution errors
 */
export class ToolExecutionError extends MetabaseError {
  constructor(message, toolName, originalError) {
    super(message, 'TOOL_EXECUTION_ERROR', { 
      toolName, 
      originalError: originalError?.message 
    });
    this.name = 'ToolExecutionError';
    this.toolName = toolName;
    this.originalError = originalError;
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends MetabaseError {
  constructor(message, operation, timeoutMs) {
    super(message, 'TIMEOUT_ERROR', { operation, timeoutMs });
    this.name = 'TimeoutError';
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

