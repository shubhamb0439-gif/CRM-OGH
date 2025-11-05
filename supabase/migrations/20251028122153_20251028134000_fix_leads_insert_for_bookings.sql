/*
  # Fix Leads Table Insert Policy

  1. Changes
    - Drop existing insert policies
    - Create new simplified policy allowing all inserts
    - This enables booking form to create leads automatically

  2. Security
    - Public can insert leads (needed for booking form)
    - Admins control all other operations via existing policies
*/

-- Drop existing insert policies
DROP POLICY IF EXISTS "Public can insert leads" ON leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON leads;

-- Create new insert policy for all users
CREATE POLICY "allow_insert_for_all"
  ON leads
  FOR INSERT
  WITH CHECK (true);
