/*
  # Add Admin Tracking Fields to Leads Table

  1. Changes
    - Add `added_by` field to track admin name who added the lead
    - Add `added_by_email` field to track admin email who added the lead
    - Add `country` field for lead's country
    - Update existing leads to have null values for these fields

  2. Fields Added
    - `added_by` (text, nullable) - Name of admin who added the lead
    - `added_by_email` (text, nullable) - Email of admin who added the lead
    - `country` (text, nullable) - Country of the lead
*/

-- Add admin tracking fields to leads table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'added_by'
  ) THEN
    ALTER TABLE leads ADD COLUMN added_by text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'added_by_email'
  ) THEN
    ALTER TABLE leads ADD COLUMN added_by_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'country'
  ) THEN
    ALTER TABLE leads ADD COLUMN country text;
  END IF;
END $$;
