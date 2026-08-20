import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snppbxvorkbnoutynmwn.supabase.co';
const supabaseKey = 'sb_publishable_PMCFL4UFy0RnLyzx9tlRYQ_woQNxcmn';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('lideres').select('*').limit(1);
    if (error) {
      console.error('Error querying lideres:', error.message);
      process.exit(1);
    }
    console.log('Success! Connection verified and table "lideres" exists.');
    console.log('Data:', data);
  } catch (err) {
    console.error('Failed to connect:', err);
    process.exit(1);
  }
}

testConnection();
