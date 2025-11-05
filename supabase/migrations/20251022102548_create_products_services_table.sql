/*
  # Create Products and Services Management Table

  ## New Tables
  - `products_services`
    - `id` (uuid, primary key) - Unique identifier
    - `name` (text) - Product or service name
    - `description` (text, optional) - Description of the product/service
    - `is_active` (boolean) - Whether the product/service is active
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    - `created_by` (text, optional) - User who created this entry
  
  ## Security
  - Enable RLS on `products_services` table
  - Add policy for public to read active products/services
  - Add policy for authenticated users to manage products/services
  
  ## Important Notes
  - This table allows dynamic management of products and services
  - Replaces hard-coded service lists throughout the application
  - Soft delete functionality via is_active flag
*/

-- Create products_services table
CREATE TABLE IF NOT EXISTS products_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text
);

-- Enable RLS
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active products and services"
  ON products_services
  FOR SELECT
  USING (is_active = true OR current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated');

CREATE POLICY "Authenticated users can insert products and services"
  ON products_services
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products and services"
  ON products_services
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_services_updated_at
  BEFORE UPDATE ON products_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default products and services
INSERT INTO products_services (name, description) VALUES
  ('Medical Scribing', 'Professional medical documentation and scribing services'),
  ('Precharting', 'Pre-visit chart preparation and documentation'),
  ('Billing and Coding', 'Medical billing and coding services'),
  ('Medical Assistance', 'General medical administrative assistance'),
  ('Call Operator', 'Medical call center and operator services'),
  ('Drug Assist', 'Medication management and assistance services')
ON CONFLICT (name) DO NOTHING;