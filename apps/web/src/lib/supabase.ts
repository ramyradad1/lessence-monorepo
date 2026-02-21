import { createSupabaseClient } from '@lessence/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
