-- Create system_logs table for telemetry and error tracking
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'perf')),
    source TEXT NOT NULL,
    action TEXT NOT NULL,
    message TEXT NOT NULL,
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We do not add a foreign key to user_id directly pointing to profiles because
-- system errors might happen before a profile exists, or for anonymous usage.
-- We keep user_id as a UUID. If it's linked to an auth.user, that's fine. 

-- Indexes for querying performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON public.system_logs(source);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_duration ON public.system_logs(duration_ms) WHERE duration_ms IS NOT NULL;

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Anyone (anon/authenticated) can insert logs. We want to capture errors from anywhere.
CREATE POLICY "Anyone can insert system logs" 
ON public.system_logs FOR INSERT 
WITH CHECK (true);

-- 2. Only admins can view logs
CREATE POLICY "Admins can view system logs" 
ON public.system_logs FOR SELECT 
USING (is_admin());

-- 3. Only admins can delete/cleanup logs
CREATE POLICY "Admins can delete system logs" 
ON public.system_logs FOR DELETE 
USING (is_admin());

-- Add a helper RPC to clean up old logs (e.g., older than 30 days) to prevent table bloat
CREATE OR REPLACE FUNCTION cleanup_old_system_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Ensure only admins can call this
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM public.system_logs
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;
