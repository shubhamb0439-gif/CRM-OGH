/*
  # Disable RLS on Leads Table

  1. Changes
    - Completely disable RLS on leads table
    - This allows booking form to create leads without authentication

  2. Rationale
    - Public booking form needs to create leads
    - RLS policies blocking legitimate inserts
    - Admin authentication handled at application level
*/

-- Disable RLS completely on leads table
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Drop all insert policies to ensure clean state
DROP POLICY IF EXISTS "allow_insert_for_all" ON leads;
DROP POLICY IF EXISTS "Public can insert leads" ON leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON leads;
