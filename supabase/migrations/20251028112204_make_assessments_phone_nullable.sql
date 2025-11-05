/*
  # Make Phone Field Nullable in Assessments Table

  This migration updates the assessments table to make the phone field nullable
  to allow users to optionally skip providing their phone number.
  
  ## Changes
  
  1. Modifications to assessments table:
    - Make `phone` column nullable
  
  ## Notes
  - This provides flexibility for users who prefer not to share their phone number
  - Existing records with phone numbers remain unchanged
*/

-- Make phone nullable in assessments table
DO $$
BEGIN
  ALTER TABLE assessments ALTER COLUMN phone DROP NOT NULL;
END $$;
