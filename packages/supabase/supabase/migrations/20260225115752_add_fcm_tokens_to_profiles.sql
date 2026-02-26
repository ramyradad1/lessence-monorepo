-- Add fcm_tokens array to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_tokens text[] DEFAULT '{}'::text[];

-- RPC to register a new FCM token
CREATE OR REPLACE FUNCTION public.register_fcm_token(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Add the token to the array if it is not already present
  UPDATE public.profiles
  SET fcm_tokens = array_append(fcm_tokens, token)
  WHERE id = auth.uid()
    AND NOT (token = ANY(fcm_tokens));
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.register_fcm_token(text) TO authenticated;

-- RPC to unregister an FCM token (e.g. on logout)
CREATE OR REPLACE FUNCTION public.unregister_fcm_token(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove the token from the array
  UPDATE public.profiles
  SET fcm_tokens = array_remove(fcm_tokens, token)
  WHERE id = auth.uid();
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.unregister_fcm_token(text) TO authenticated;
