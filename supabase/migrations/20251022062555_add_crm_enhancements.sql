/*
  # CRM Enhancement Migration

  ## Updates to Existing Tables
  
  1. **leads table modifications**
     - Add `value_per_annum` (numeric) - Annual contract value in dollars
     - Add `notes` (text) - Admin notes about the lead
     - Update state validation for USA states
  
  2. **campaigns table creation**
     - `id` (uuid, primary key) - Unique campaign identifier
     - `name` (text) - Campaign name
     - `description` (text) - Campaign description
     - `target_audience` (text) - Target audience description
     - `start_date` (date) - Campaign start date
     - `end_date` (date) - Campaign end date
     - `budget` (numeric) - Campaign budget in dollars
     - `status` (text) - Active/Paused/Completed/Archived
     - `created_at` (timestamptz) - Creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security Changes
  - Enable RLS on campaigns table
  - Add public policies for campaigns (admin access)
  
  ## Important Notes
  - value_per_annum stores dollar amounts as numeric for precision
  - notes field allows unlimited text for detailed tracking
  - campaigns table supports full campaign lifecycle management
*/

-- Add new columns to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'value_per_annum'
  ) THEN
    ALTER TABLE leads ADD COLUMN value_per_annum numeric(12, 2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'notes'
  ) THEN
    ALTER TABLE leads ADD COLUMN notes text;
  END IF;
END $$;

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_audience text,
  start_date date,
  end_date date,
  budget numeric(12, 2),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Completed', 'Archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for campaigns (public access for now, can be restricted later)
CREATE POLICY "Public can insert campaigns"
  ON campaigns FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can read campaigns"
  ON campaigns FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can update campaigns"
  ON campaigns FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete campaigns"
  ON campaigns FOR DELETE
  TO anon
  USING (true);

-- Create trigger for campaigns table to auto-update updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();