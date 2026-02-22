import { useEffect, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { TelemetryLogger } from '../src/utils/telemetry';

export function usePerformanceTracking(
  supabase: SupabaseClient, 
  actionName: string, 
  source: 'web-client' | 'mobile-client' = 'web-client',
  metadata?: Record<string, any>
) {
  const loggerRef = useRef<TelemetryLogger | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  const trackedRef = useRef<boolean>(false);

  if (!loggerRef.current) {
    loggerRef.current = new TelemetryLogger(supabase, source);
  }

  useEffect(() => {
    // Only track once per mount
    if (trackedRef.current) return;

    // Component has mounted. We track the time from render start to mount effect.
    const duration = Date.now() - mountTimeRef.current;
    
    // Log the performance metric
    loggerRef.current?.perf({
      action: `${actionName}_mount`,
      message: `Component mounted in ${duration}ms`,
      duration_ms: duration,
      metadata: { ...metadata, type: 'react_mount' }
    });
    
    trackedRef.current = true;

    return () => {
      // Track unmount duration if needed, or total lifetime
      const unmountDuration = Date.now() - mountTimeRef.current;
      loggerRef.current?.perf({
        action: `${actionName}_unmount`,
        message: `Component unmounted after ${unmountDuration}ms`,
        duration_ms: unmountDuration,
        metadata: { ...metadata, type: 'react_lifetime' }
      });
    };
  }, [actionName, source, metadata]);
}
