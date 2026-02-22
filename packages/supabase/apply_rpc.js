const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../apps/web/.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env.local');
    return;
  }
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, 'supabase', 'migrations', '20260222161700_update_search_bilingual.sql'), 'utf8');
    await client.query(sql);
    console.log('Successfully updated search_products RPC!');
  } catch (err) {
    console.error('Error applying SQL:', err);
  } finally {
    await client.end();
  }
}
run();
