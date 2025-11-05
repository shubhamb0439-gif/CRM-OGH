/*
  # Update Booking Slots for UTC Storage and Add Products & Innovation Table

  1. Changes to booking_slots table
    - Add time_slot_utc column (timestamptz) for storing booking time in UTC
    - Keep existing time_slot for display purposes
    - Update structure to support timezone-aware bookings

  2. Create products_and_innovation table
    - Separate table for innovation products (Drug Assist, etc.)
    - Independent from main products_services table
    - Supports Add New, Edit, Delete operations

  3. Security
    - Enable RLS on products_and_innovation
    - Public read access, authenticated write access
*/

-- Add time_slot_utc column to booking_slots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_slots' AND column_name = 'time_slot_utc'
  ) THEN
    ALTER TABLE booking_slots ADD COLUMN time_slot_utc timestamptz;
  END IF;
END $$;

-- Create products_and_innovation table
CREATE TABLE IF NOT EXISTS products_and_innovation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text
);

-- Enable RLS on products_and_innovation
ALTER TABLE products_and_innovation ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view innovation products" ON products_and_innovation;
  DROP POLICY IF EXISTS "Authenticated users can manage innovation products" ON products_and_innovation;
END $$;

-- Allow public to read innovation products
CREATE POLICY "Public can view innovation products"
  ON products_and_innovation FOR SELECT
  TO public
  USING (is_active = true);

-- Only authenticated users can manage innovation products
CREATE POLICY "Authenticated users can manage innovation products"
  ON products_and_innovation FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial innovation products
INSERT INTO products_and_innovation (name, description, is_active) VALUES
  ('Drug Assist', 'Medication assistance and prescription management', true)
ON CONFLICT (name) DO NOTHING;
