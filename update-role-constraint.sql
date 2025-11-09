-- Migration to update profiles table role constraint to use lowercase roles
-- Run this in your Supabase SQL Editor after updating the database-setup.sql

-- First, update any existing capitalized roles to lowercase BEFORE changing the constraint
UPDATE public.profiles SET role = LOWER(role) WHERE role IN ('Admin', 'Staff');

-- Drop the existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with lowercase roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK ((role = ANY (ARRAY['admin'::text, 'staff'::text])));

-- Verify the constraint was updated
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'profiles_role_check';