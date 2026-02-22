const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../web/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('Testing search_products RPC...');
  const { data, error } = await supabase.rpc('search_products', { search_query: 'oud', sort_by: 'newest' });
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data count:', data ? data.length : 0);
  }
}
run();
