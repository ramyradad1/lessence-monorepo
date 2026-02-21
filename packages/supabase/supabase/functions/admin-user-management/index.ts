import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !requester) throw new Error('Invalid token')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single()

    if (!profile || profile.role !== 'super_admin') throw new Error('Unauthorized: Super Admin access required')

    const { action, userData, userId, updates } = await req.json()

    if (action === 'create') {
      const { email, password, full_name, role } = userData
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      })

      if (createError) throw createError

      if (newUser.user) {
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: newUser.user.id,
            email,
            full_name,
            role: role || 'user'
          })
      }

      return new Response(JSON.stringify({ success: true, user: newUser.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'update') {
      if (!userId) throw new Error('User ID is required for update')
      const { email, password, full_name, role } = updates

      // Update Auth
      const authUpdates: any = {}
      if (email) authUpdates.email = email
      if (password) authUpdates.password = password
      if (full_name) authUpdates.user_metadata = { ...authUpdates.user_metadata, full_name }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates)
        if (authUpdateError) throw authUpdateError
      }

      // Update Profile
      const profileUpdates: any = {}
      if (email) profileUpdates.email = email
      if (full_name) profileUpdates.full_name = full_name
      if (role) profileUpdates.role = role

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId)
        if (profileUpdateError) throw profileUpdateError
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'delete') {
      if (!userId) throw new Error('User ID is required for deletion')
      if (userId === requester.id) throw new Error('Cannot delete yourself')

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) throw deleteError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action')
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
