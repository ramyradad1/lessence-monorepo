import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
       return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    // Checking if the user has an admin role
    const { data: profile } = await supabaseClient
       .from('profiles')
       .select('role')
       .eq('id', user.id)
       .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admins only' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
    }

    const { text, target_language } = await req.json();

    if (!text || !target_language) {
      return new Response(JSON.stringify({ error: 'Missing text or target_language' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'OPENAI_API_KEY missing server-side' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${OPENAI_API_KEY}`
       },
       body: JSON.stringify({
           model: 'gpt-4o-mini',
           messages: [
               { role: 'system', content: `You are an expert translator for an ecommerce platform. Translate the following text into ${target_language}. Return ONLY the translated text, no conversational filler or quotes.` },
               { role: 'user', content: text }
           ],
           temperature: 0.3
       })
    });

    if (!openaiResponse.ok) {
        const err = await openaiResponse.text();
        throw new Error(`OpenAI Error: ${err}`);
    }

    const openaiResult = await openaiResponse.json();
    const translatedText = openaiResult.choices[0].message.content.trim();

    return new Response(JSON.stringify({ translatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    console.error("Translate error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

