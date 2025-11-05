/*
  # Add Website Field to Consultancy Bookings

  ## Changes
  - Add `website` column to `consultancy_bookings` table
    - Optional text field to store facility website URL
    - Allows NULL values as it's an optional field
  
  ## Notes
  - This enables tracking of facility websites for better lead qualification
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultancy_bookings' AND column_name = 'website'
  ) THEN
    ALTER TABLE consultancy_bookings ADD COLUMN website text;
  END IF;
END $$;