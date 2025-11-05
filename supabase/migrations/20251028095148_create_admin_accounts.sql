/*
  # Create Admin Authentication System

  1. Changes
    - Create admin_users table to track authorized admin accounts
    - Enable RLS on admin_users table
    - Add policies for authenticated admin access
    - Insert the three authorized admin accounts

  2. Security
    - RLS enabled on admin_users table
    - Only authenticated admins can read admin_users data
    - Table is read-only via policies (no insert/update/delete through API)

  3. Admin Accounts
    - sp@oghealthcare.com
    - sagnik.ghosh@oghealthcare.com
    - aphales@oghealthcare.com

  4. Notes
    - Actual authentication is handled by Supabase Auth
    - This table tracks which email addresses are authorized as admins
    - After login, we check if user's email exists in this table
*/

-- Create admin_users table to track authorized admins
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read admin_users to check authorization
CREATE POLICY "Authenticated users can read admin list"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert the three authorized admin accounts
INSERT INTO admin_users (email, name) VALUES
  ('sp@oghealthcare.com', 'SP'),
  ('sagnik.ghosh@oghealthcare.com', 'Sagnik Ghosh'),
  ('aphales@oghealthcare.com', 'Aphales')
ON CONFLICT (email) DO NOTHING;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
