/*
  # Add Admin Tracking Fields to Leads

  1. Changes
    - Add `added_by` column to track admin name who added the lead
    - Add `added_by_email` column to track admin email who added the lead
    - Update source constraint to include 'Existing Client' and 'Ex-Client'
    - Update admin user names to be more readable

  2. Security
    - No RLS changes needed as leads table already has appropriate policies
*/

-- Add new fields to leads table for admin tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS added_by text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS added_by_email text;

-- Update the source constraint to include new options
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check 
CHECK (source IN (
  'Assessment',
  'Consultancy',
  'LinkedIn',
  'WhatsApp',
  'Call',
  'Email',
  'Referral',
  'Existing Client',
  'Ex-Client'
));

-- Update admin names to be more readable
UPDATE admin_users SET name = 'Sanj Patel' WHERE email = 'sp@oghealthcare.com';
UPDATE admin_users SET name = 'Sagnik Ghosh' WHERE email = 'sagnik.ghosh@oghealthcare.com';
UPDATE admin_users SET name = 'Anthony Hales' WHERE email = 'aphales@oghealthcare.com';
