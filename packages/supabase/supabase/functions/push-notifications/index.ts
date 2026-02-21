import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: PushPayload = await req.json()
    const { user_id, type, title, body, data } = payload

    // 1. Check user notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (prefError) {
      console.error('Error fetching preferences:', prefError)
      // If no preferences record exists, we might assume default opt-in or log and skip
      // In our setup, we have a trigger to create them, so this shouldn't happen often.
    }

    if (preferences) {
      // Logic for enabling/disabling based on type
      let isEnabled = preferences.push_enabled
      
      if (isEnabled) {
        if (type === 'order_update' && !preferences.order_updates) isEnabled = false
        if (type === 'back_in_stock' && !preferences.back_in_stock) isEnabled = false
        if (type === 'price_drop' && !preferences.price_drop) isEnabled = false
        if (type === 'promotion' && !preferences.promotions) isEnabled = false
      }

      if (!isEnabled) {
        return new Response(JSON.stringify({ message: 'Notifications disabled for this user/type' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 2. Fetch push tokens for the user
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', user_id)

    if (tokenError || !tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No push tokens found for user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Prepare messages for Expo Push API
    const messages = tokens.map(t => ({
      to: t.token,
      sound: 'default',
      title: title,
      body: body,
      data: data || {},
    }))

    // 4. Send to Expo
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()
    console.log('Expo Push API result:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    })

  } catch (error: any) {
    console.error('Error in push-notifications function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
