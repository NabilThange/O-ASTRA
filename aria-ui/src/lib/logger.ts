/**
 * Structured client-side logger for aria-ui.
 *
 * Follows the same 12 best practices as the backend:
 * - Structured JSON output (machine-parseable)
 * - Log levels with runtime control via NEXT_PUBLIC_LOG_LEVEL
 * - Sensitive data never logged
 * - Canonical log lines for key user actions
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const configuredLevel: LogLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[configuredLevel];
}

function emit(level: LogLevel, fields: Record<string, unknown>, msg: string): void {
  if (!shouldLog(level)) return;

  const entry = {
    level,
    msg,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  // In production, emit JSON for log aggregators (e.g. Datadog browser SDK)
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
  } else {
    // Dev: pretty print with context
    const prefix = `[${entry.timestamp.slice(11, 23)}] [${level.toUpperCase()}]`;
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](prefix, msg, fields);
  }
}

export const logger = {
  debug: (fields: Record<string, unknown>, msg: string) => emit('debug', fields, msg),
  info: (fields: Record<string, unknown>, msg: string) => emit('info', fields, msg),
  warn: (fields: Record<string, unknown>, msg: string) => emit('warn', fields, msg),
  error: (fields: Record<string, unknown>, msg: string, err?: Error) =>
    emit('error', {
      ...fields,
      ...(err ? { error: { message: err.message, stack: err.stack } } : {}),
    }, msg),

  /**
   * Canonical log line — one rich entry per significant user action.
   * Use at the end of operations to capture: who, what, outcome, duration.
   */
  canonical: (fields: {
    event: string;
    durationMs?: number;
    outcome: 'success' | 'failure' | 'partial';
    [key: string]: unknown;
  }) => emit('info', fields, `[CANONICAL] ${fields.event}`),
};
