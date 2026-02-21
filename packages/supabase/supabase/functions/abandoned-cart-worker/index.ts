import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // We expect this to be called by a cron trigger, but we need service role keys to act broadly
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // 1. Find carts that haven't had interaction in > 1 hour and haven't had a reminder
    const { data: abandonedCarts, error: fetchError } = await supabase
      .from('cart_activity')
      .select('cart_id, carts(user_id, session_id)')
      .lt('last_interaction_at', oneHourAgo)
      .eq('recovery_status', 'none')

    if (fetchError) throw fetchError

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return new Response(JSON.stringify({ message: 'No abandoned carts found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let notifiedCount = 0

    // 2. Process each abandoned cart
    for (const activity of abandonedCarts) {
      const cart = Array.isArray(activity.carts) ? activity.carts[0] : activity.carts;
      if (!cart || !cart.user_id) {
        // We only send reminders to logged-in users who have a user_id
        continue
      }

      const userId = cart.user_id

      // Create an in-app notification
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'You left something behind! 🛍️',
          message: 'Your cart misses you. Complete your checkout to secure your items before they sell out.',
          metadata: { type: 'abandoned_cart', cart_id: activity.cart_id },
        })

      if (insertError) {
        console.error('Failed to insert notification for user:', userId, insertError)
        continue
      }

      // Update the recovery status
      await supabase
        .from('cart_activity')
        .update({
          recovery_status: 'reminder_1_sent',
          reminder_sent_at: new Date().toISOString(),
        })
        .eq('cart_id', activity.cart_id)

      // TODO: Call Email Provider (e.g. Resend, SendGrid) to send recovery email
      console.log(`[Email Hook Placeholder] Sent recovery email to user ${userId}`)

      // TODO: Call Push Provider (e.g. Expo Push) to send mobile push notification
      console.log(`[Push Hook Placeholder] Sent push notification to user ${userId}`)

      notifiedCount++
    }

    return new Response(JSON.stringify({ message: 'Processed abandoned carts', count: notifiedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Error processing abandoned carts:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
