/*
  # Fix consultancy_bookings table - Make phone nullable

  1. Changes
    - Make phone column nullable since it's now optional
    - This allows users to submit bookings without a phone number

  2. Notes
    - Phone is already optional in the UI
    - This aligns the database schema with the form requirements
*/

-- Make phone column nullable
ALTER TABLE consultancy_bookings 
ALTER COLUMN phone DROP NOT NULL;
