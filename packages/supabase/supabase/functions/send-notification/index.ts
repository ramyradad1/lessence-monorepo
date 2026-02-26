import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  user_id: string; // The user to send to
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json() as NotificationPayload;
    
    // Initialize Supabase admin client to bypass RLS and fetch the user's tokens
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch user's FCM/WebPush tokens
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('fcm_tokens')
      .eq('id', payload.user_id)
      .single()

    if (profileError || !profile) {
      throw new Error(`User profile not found: ${profileError?.message}`);
    }

    const tokens: string[] = profile.fcm_tokens || []

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No notification tokens found for this user." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 2. Here you would integrate with your push provider (Firebase Admin SDK or native VAPID Web Push).
    // Because Firebase Admin uses Node.js crypto which is tricky in Deno, a common approach is to 
    // orchestrate the push via a 3rd party like OneSignal, or strictly use fetch() to FCM v1 API with a JWT.
    // Assuming FCM tokens for Mobile and VAPID objects for Web exist in the array:

    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY'); 
    // Note: FCM legacy API is deprecated, you typically need OAuth2 for HTTP v1 API.

    console.log(`Sending notification "${payload.title}" to user ${payload.user_id} (${tokens.length} devices)`);
    
    // For demonstration, simulating successful dispatch
    // In production, loop over `tokens`, identify if it's a mobile FCM token or Web Push subscription JSON,
    // and route via fetch() to FCM or WebPush endpoint accordingly.

    return new Response(
      JSON.stringify({ success: true, message: `Notification queued for ${tokens.length} devices.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error("Error sending notification:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
