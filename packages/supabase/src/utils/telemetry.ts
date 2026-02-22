import { SupabaseClient } from '@supabase/supabase-js';

type LogLevel = 'info' | 'warn' | 'error' | 'perf';
type LogSource = 'web-client' | 'mobile-client' | 'edge-function' | string;

interface LogPayload {
  level: LogLevel;
  source: LogSource;
  action: string;
  message: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

export class TelemetryLogger {
  private supabase: SupabaseClient;
  private source: LogSource;

  constructor(supabaseClient: SupabaseClient, source: LogSource) {
    this.supabase = supabaseClient;
    this.source = source;
  }

  /**
   * Fire-and-forget log insertion
   */
  private async log(payload: Omit<LogPayload, 'source' | 'level'> & { level: LogLevel }) {
    try {
      // Background execution to avoid blocking the caller
      this.supabase.from('system_logs').insert({
        level: payload.level,
        source: this.source,
        action: payload.action,
        message: payload.message,
        duration_ms: payload.duration_ms,
        metadata: payload.metadata,
        user_id: payload.user_id,
        session_id: payload.session_id,
      }).then();
    } catch (e) {
      // Fallback console logging in case Supabase itself is unreachable
      console.error('Failed to log telemetry event:', e);
    }
  }

  public info(payload: Omit<LogPayload, 'source' | 'level'>) {
    this.log({ ...payload, level: 'info' });
  }

  public warn(payload: Omit<LogPayload, 'source' | 'level'>) {
    this.log({ ...payload, level: 'warn' });
    console.warn(`[${this.source}] ${payload.action}:`, payload.message, payload.metadata);
  }

  public error(payload: Omit<LogPayload, 'source' | 'level'>) {
    this.log({ ...payload, level: 'error' });
    console.error(`[${this.source}] ERROR ${payload.action}:`, payload.message, payload.metadata);
  }

  public perf(payload: Omit<LogPayload, 'source' | 'level'>) {
    this.log({ ...payload, level: 'perf' });
  }
}

/**
 * Wraps a promise-returning function with retry logic and performance monitoring.
 */
export async function withRetryAndLog<T>(
  actionName: string,
  logger: TelemetryLogger,
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    slowThresholdMs?: number;
    context?: Record<string, any>;
    userId?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelayMs = 500,
    slowThresholdMs = 500,
    context = {},
    userId
  } = options;

  let attempt = 0;
  let lastError: any;
  const startTime = Date.now();

  while (attempt <= maxRetries) {
    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      // Log slow queries immediately
      if (duration > slowThresholdMs) {
        logger.perf({
          action: actionName,
          message: `Slow execution: ${duration}ms`,
          duration_ms: duration,
          metadata: { ...context, attempt },
          user_id: userId,
        });
      }

      return result;
    } catch (err: any) {
      lastError = err;
      
      // Determine if error is transient (network issues, 5xx server errors, timeout)
      const isTransient = 
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('fetch') ||
        err?.status >= 500 ||
        err?.code === 'PGRST301' || // Example: connection error
        err instanceof TypeError; // often thrown on network failure
      
      if (!isTransient || attempt >= maxRetries) {
        break;
      }

      attempt++;
      const delay = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
      
      logger.warn({
        action: actionName,
        message: `Transient error, retrying (${attempt}/${maxRetries}) in ${delay}ms`,
        metadata: { error: err?.message || String(err), code: err?.code, ...context },
        user_id: userId,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we broke out of the loop without returning, it means we failed all retries or hit a fatal error
  const duration = Date.now() - startTime;
  
  logger.error({
    action: actionName,
    message: lastError?.message || String(lastError),
    duration_ms: duration,
    metadata: {
      code: lastError?.code,
      details: lastError?.details,
      hint: lastError?.hint,
      ...context
    },
    user_id: userId,
  });

  throw lastError;
}
