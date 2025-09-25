-- Add policies to allow public access to the companies table
-- Run this in your Supabase SQL Editor

-- Drop existing policies if any (to ensure a clean slate)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.companies;


-- 1. Create a policy for reading data
-- This policy allows anyone to view the companies table.
CREATE POLICY "Enable read access for all users" ON public.companies
  FOR SELECT USING (true);

-- 2. Create a policy for inserting data
-- This policy allows anyone to insert new rows into the companies table.
CREATE POLICY "Enable insert access for all users" ON public.companies
  FOR INSERT WITH CHECK (true);

-- 3. Create a policy for updating data
-- This policy allows anyone to update existing rows.
CREATE POLICY "Enable update access for all users" ON public.companies
  FOR UPDATE USING (true);

-- 4. Create a policy for deleting data
-- This policy allows anyone to delete rows.
CREATE POLICY "Enable delete access for all users" ON public.companies
  FOR DELETE USING (true);
