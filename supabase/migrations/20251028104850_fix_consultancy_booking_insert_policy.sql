/*
  # Fix Consultancy Booking Insert Policy

  This migration adds an INSERT policy for authenticated users to the consultancy_bookings table.
  
  ## Changes
  - Add INSERT policy for authenticated users to allow booking submissions when logged in
  
  ## Reason
  Currently, only anonymous users can insert bookings. This prevents authenticated users
  (like admins testing the form) from submitting bookings. This policy allows both
  anonymous and authenticated users to create bookings.
*/

-- Drop existing policy if it exists and recreate
DO $$
BEGIN
  -- Drop policy if it exists
  DROP POLICY IF EXISTS "Authenticated can insert bookings" ON consultancy_bookings;
  
  -- Create the new policy
  CREATE POLICY "Authenticated can insert bookings"
    ON consultancy_bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
END $$;
