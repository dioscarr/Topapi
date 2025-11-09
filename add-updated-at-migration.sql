-- Migration: Add updated_at column to inventory_items table
-- Run this in Supabase SQL Editor to add the missing updated_at column

-- Add updated_at column to inventory_items table
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone null;

-- Set default value for existing rows
UPDATE public.inventory_items
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Create trigger for inventory_items table
DROP TRIGGER IF EXISTS on_inventory_items_updated ON public.inventory_items;
CREATE TRIGGER on_inventory_items_updated
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory_items'
AND table_schema = 'public'
ORDER BY ordinal_position;