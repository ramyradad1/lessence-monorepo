"use client";

import { usePerformanceTracking } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";

interface PerformanceTrackerProps {
  actionName: string;
  source?: "web-client" | "mobile-client";
  metadata?: Record<string, unknown>;
}

export function PerformanceTracker({ actionName, source = "web-client", metadata }: PerformanceTrackerProps) {
  usePerformanceTracking(supabase, actionName, source, metadata);
  return null;
}
