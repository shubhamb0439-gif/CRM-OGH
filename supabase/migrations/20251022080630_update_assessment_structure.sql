/*
  # Update Assessment Structure

  ## Changes to assessments table
  - Add `selected_challenges` (text array) - stores Q6 checkbox selections
  - Add `recommended_services` (text array) - stores service recommendations based on challenges
  
  ## Changes to leads table
  - Update `source` to include new options: LinkedIn, WhatsApp, Call, Email, Referral
  - Add `selected_services` (text array) - for multiple service selections
  
  ## Important Notes
  - Supports new 100-point scoring system
  - Allows multiple challenge and service selections
  - Maintains backward compatibility with existing data
*/

-- Add new columns to assessments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'selected_challenges'
  ) THEN
    ALTER TABLE assessments ADD COLUMN selected_challenges text[];
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'recommended_services'
  ) THEN
    ALTER TABLE assessments ADD COLUMN recommended_services text[];
  END IF;
END $$;

-- Add new column to leads table for multiple service selections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'selected_services'
  ) THEN
    ALTER TABLE leads ADD COLUMN selected_services text[];
  END IF;
END $$;