/**
 * Migration script to add updated_at column to inventory_items table
 */

require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add updated_at column to inventory_items');

    // Check if column already exists
    console.log('� Checking if updated_at column exists...');
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'inventory_items')
      .eq('table_schema', 'public')
      .eq('column_name', 'updated_at');

    if (checkError) {
      console.error('❌ Error checking columns:', checkError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ updated_at column already exists, skipping migration');
      return;
    }

    // Since we can't run DDL through Supabase client, we'll provide instructions
    console.log('⚠️  Cannot run DDL through Supabase client');
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('');
    console.log(`
-- Add updated_at column to inventory_items table
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone null;

-- Set default value for existing rows
UPDATE public.inventory_items
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory_items'
AND table_schema = 'public'
ORDER BY ordinal_position;
    `);
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/aronyliifkuajnelwlam/sql');
    console.log('� Run the SQL above in the SQL Editor');

  } catch (error) {
    console.error('❌ Migration script failed:', error);
  }
}

runMigration();