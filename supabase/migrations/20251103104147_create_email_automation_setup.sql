/*
  # Create Email Automation Setup

  1. New Tables
    - `email_schedules` - Stores email automation configurations
      - `id` (uuid, primary key)
      - `report_type` (text) - 'weekly' or 'monthly'
      - `recipient_emails` (text[]) - Array of email addresses
      - `is_active` (boolean) - Whether the schedule is active
      - `last_sent_at` (timestamptz) - Last time the email was sent
      - `next_send_at` (timestamptz) - Next scheduled send time
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_schedules` table
    - Only authenticated admins can manage email schedules

  3. Initial Data
    - Create default weekly and monthly schedules (inactive by default)
*/

-- Create email_schedules table
CREATE TABLE IF NOT EXISTS email_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('weekly', 'monthly')),
  recipient_emails text[] NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT false,
  last_sent_at timestamptz,
  next_send_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view email schedules"
  ON email_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admins can insert email schedules"
  ON email_schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admins can update email schedules"
  ON email_schedules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admins can delete email schedules"
  ON email_schedules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Insert default schedules (inactive)
INSERT INTO email_schedules (report_type, is_active, recipient_emails)
VALUES 
  ('weekly', false, ARRAY[]::text[]),
  ('monthly', false, ARRAY[]::text[])
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_email_schedules_updated_at_trigger ON email_schedules;
CREATE TRIGGER update_email_schedules_updated_at_trigger
  BEFORE UPDATE ON email_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_email_schedules_updated_at();
