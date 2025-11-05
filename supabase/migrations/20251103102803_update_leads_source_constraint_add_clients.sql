/*
  # Update leads source constraint to include client types

  1. Changes
    - Drop existing source constraint on leads table
    - Add new constraint that includes 'Existing Client' and 'Ex-Client' as valid sources
    - This allows manually added leads to be marked with these client-related sources

  2. Valid Sources After Update
    - Assessment
    - Consultancy
    - LinkedIn
    - WhatsApp
    - Call
    - Email
    - Referral
    - Existing Client
    - Ex-Client
*/

-- Drop the existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;

-- Add updated constraint with new source types
ALTER TABLE leads ADD CONSTRAINT leads_source_check 
CHECK (source = ANY (ARRAY[
  'Assessment'::text, 
  'Consultancy'::text, 
  'LinkedIn'::text, 
  'WhatsApp'::text, 
  'Call'::text, 
  'Email'::text, 
  'Referral'::text,
  'Existing Client'::text,
  'Ex-Client'::text
]));
