/*
  # Recreate RLS for Consultancy Bookings V2

  1. Changes
    - Disable RLS temporarily
    - Drop all existing policies
    - Re-enable RLS
    - Create fresh policies with correct permissions

  2. Security
    - Allow public inserts (for booking form)
    - Require admin authentication for all other operations
*/

-- Disable RLS
ALTER TABLE consultancy_bookings_v2 DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can insert bookings" ON consultancy_bookings_v2;
DROP POLICY IF EXISTS "Anyone can submit bookings" ON consultancy_bookings_v2;
DROP POLICY IF EXISTS "Admins can read all bookings" ON consultancy_bookings_v2;
DROP POLICY IF EXISTS "Admins can update bookings" ON consultancy_bookings_v2;
DROP POLICY IF EXISTS "Admins can delete bookings" ON consultancy_bookings_v2;

-- Re-enable RLS
ALTER TABLE consultancy_bookings_v2 ENABLE ROW LEVEL SECURITY;

-- Create policy for public inserts (booking form submissions)
CREATE POLICY "enable_insert_for_all"
  ON consultancy_bookings_v2
  FOR INSERT
  WITH CHECK (true);

-- Create policy for admin reads
CREATE POLICY "enable_read_for_admins"
  ON consultancy_bookings_v2
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Create policy for admin updates
CREATE POLICY "enable_update_for_admins"
  ON consultancy_bookings_v2
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create policy for admin deletes
CREATE POLICY "enable_delete_for_admins"
  ON consultancy_bookings_v2
  FOR DELETE
  TO authenticated
  USING (is_admin());
