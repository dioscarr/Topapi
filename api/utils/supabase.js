/**
 * Supabase Client Configuration
 * 
 * This module creates and exports a configured Supabase client
 * for database operations throughout the application.
 */

const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Create service role client for admin operations (bypasses RLS)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

console.log('Supabase Admin client created:', !!supabaseAdmin);
console.log('Service key available:', !!supabaseServiceKey);

module.exports = supabase;
module.exports.admin = supabaseAdmin;
