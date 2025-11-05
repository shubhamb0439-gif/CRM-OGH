/*
  # Make Leads Phone Field Nullable

  1. Changes
    - Alter leads.phone column to allow NULL values
    - This enables assessment submissions without phone numbers to create leads

  2. Rationale
    - Assessment form phone field is optional
    - Bookings may not always have phone numbers
    - Allow lead creation with partial contact information
*/

-- Make phone field nullable
ALTER TABLE leads ALTER COLUMN phone DROP NOT NULL;
