type LogLevel = 'info' | 'warn' | 'error';

// List of keys that should be redacted to prevent data leaks
const SENSITIVE_KEYS = [
  'password',
  'token',
  'key',
  'secret',
  'email',
  'authorization',
  'cookie',
  'session',
  'pass',
  'apikey',
  'api_key'
];

/**
 * Deeply sanitizes an object by redacting sensitive values.
 */
function sanitizeObject(obj: any, depth = 0): any {
  // Prevent infinite recursion or overly deep nesting
  if (depth > 5) return '[Max Depth Exceeded]';

  if (obj === null || obj === undefined) return obj;

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Error objects specifically
  if (obj instanceof Error) {
    return {
      message: obj.message,
      name: obj.name,
      stack: obj.stack,
    };
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  // Handle Objects
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
      key.toLowerCase().includes(sensitiveKey)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
  }

  return sanitized;
}

function formatLogMessage(level: LogLevel, message: string, metadata?: any): string {
  const timestamp = new Date().toISOString();
  let formattedMetadata = '';

  if (metadata !== undefined) {
    try {
      const sanitized = sanitizeObject(metadata);
      formattedMetadata = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);
    } catch (e) {
      formattedMetadata = '[Serialization Error]';
    }
  }

  return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedMetadata ? ' | ' + formattedMetadata : ''}`;
}


function serializeMessage(msg: any): string {
  if (typeof msg === 'string') return msg;
  if (msg instanceof Error) return msg.message;
  try {
    return JSON.stringify(msg);
  } catch (e) {
    return String(msg);
  }
}

export const logger = {
  info: (message: any, ...metadata: any[]) => {
    const meta = metadata.length > 1 ? metadata : metadata[0];
    console.log(formatLogMessage('info', serializeMessage(message), meta));
  },
  warn: (message: any, ...metadata: any[]) => {
    const meta = metadata.length > 1 ? metadata : metadata[0];
    console.warn(formatLogMessage('warn', serializeMessage(message), meta));
  },
  error: (message: any, ...metadata: any[]) => {
    const meta = metadata.length > 1 ? metadata : metadata[0];
    // If the first argument is an Error and no metadata is provided, log the error object as metadata to preserve stack traces.
    const actualMeta = (message instanceof Error && metadata.length === 0) ? message : meta;
    console.error(formatLogMessage('error', serializeMessage(message), actualMeta));
  }
};
