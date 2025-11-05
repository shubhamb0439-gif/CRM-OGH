/*
  # Fix Consultancy Bookings RLS Policies

  1. Changes
    - Drop existing insert policies that only allow authenticated users
    - Create new policy allowing anonymous users to insert bookings
    - This allows public booking form submissions without authentication

  2. Security
    - Maintain admin-only access for viewing, updating, and deleting
    - Allow anyone (anon + authenticated) to insert bookings
*/

DROP POLICY IF EXISTS "Authenticated can insert bookings" ON consultancy_bookings;
DROP POLICY IF EXISTS "Public can insert bookings" ON consultancy_bookings;

CREATE POLICY "Anyone can insert bookings"
  ON consultancy_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
