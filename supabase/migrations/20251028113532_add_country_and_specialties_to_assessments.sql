/*
  # Add Country and Specialties to Assessments Table

  This migration adds missing fields to the assessments table that are
  collected in the assessment form but were not being stored.
  
  ## Changes
  
  1. Add columns to assessments table:
    - `country` (text) - Country code selected by user
    - `specialties` (text array) - Medical specialties selected by user
  
  ## Important Notes
  - These fields are collected in the assessment form and needed for proper reporting
  - Both fields are nullable to maintain backward compatibility with existing records
  - Specialties is an array to support multiple selections
*/

-- Add country field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'country'
  ) THEN
    ALTER TABLE assessments ADD COLUMN country text;
  END IF;
END $$;

-- Add specialties field (array)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE assessments ADD COLUMN specialties text[];
  END IF;
END $$;
