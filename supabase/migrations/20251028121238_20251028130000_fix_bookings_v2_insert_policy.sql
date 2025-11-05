/*
  # Fix Insert Policy for Consultancy Bookings V2

  1. Changes
    - Drop existing insert policy
    - Create new simplified policy that allows all inserts
    - This enables both anonymous and authenticated users to submit bookings

  2. Security
    - Public can insert bookings (needed for booking form)
    - Admins still control all other operations
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Anyone can submit bookings" ON consultancy_bookings_v2;

-- Create new insert policy for public access
CREATE POLICY "Public can insert bookings"
  ON consultancy_bookings_v2
  FOR INSERT
  TO public
  WITH CHECK (true);
