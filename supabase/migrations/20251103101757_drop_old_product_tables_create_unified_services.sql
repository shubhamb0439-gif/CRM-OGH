/*
  # Drop Old Product Tables and Create Unified Services Table

  1. Changes
    - Drop `products_services` table and its policies
    - Drop `products_and_innovation` table and its policies
    - Create new `services` table to manage all services/products
    - Add visibility control field `is_visible` to show/hide services on frontend
    - Enable RLS with policies for public read (only visible items) and admin management

  2. New Table Structure
    - `services` table:
      - `id` (uuid, primary key)
      - `name` (text, unique, required)
      - `description` (text, optional)
      - `category` (text) - either 'Service' or 'Innovation'
      - `is_visible` (boolean) - controls frontend visibility
      - `sort_order` (integer) - for custom ordering
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (text, tracks who added it)

  3. Security
    - Enable RLS on `services` table
    - Public can only read visible services (is_visible = true)
    - Authenticated admins can manage all services
*/

-- Drop old tables and their policies
DROP TABLE IF EXISTS products_services CASCADE;
DROP TABLE IF EXISTS products_and_innovation CASCADE;

-- Create new unified services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('Service', 'Innovation')),
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_visible ON services(is_visible);
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services(sort_order);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public can read only visible services
CREATE POLICY "Public can read visible services"
  ON services
  FOR SELECT
  TO anon
  USING (is_visible = true);

-- Authenticated users can read all services
CREATE POLICY "Authenticated can read all services"
  ON services
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can insert services
CREATE POLICY "Admins can insert services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update services
CREATE POLICY "Admins can update services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete services
CREATE POLICY "Admins can delete services"
  ON services
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Insert initial services data
INSERT INTO services (name, category, is_visible, sort_order) VALUES
  ('Medical Scribing', 'Service', true, 1),
  ('Precharting', 'Service', true, 2),
  ('Billing and Coding', 'Service', true, 3),
  ('Medical Assistance', 'Service', true, 4),
  ('Call Operator', 'Service', true, 5),
  ('Drug Assist', 'Service', true, 6),
  ('Drug Assist Innovation', 'Innovation', true, 1)
ON CONFLICT (name) DO NOTHING;
