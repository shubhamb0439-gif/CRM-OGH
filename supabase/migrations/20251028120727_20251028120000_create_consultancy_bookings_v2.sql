/*
  # Create New Consultancy Bookings System

  1. New Tables
    - `consultancy_bookings_v2`
      - `id` (uuid, primary key)
      - `full_name` (text) - Customer's full name
      - `email` (text) - Customer's email address
      - `phone` (text, nullable) - Customer's phone with country code
      - `country` (text) - Country name
      - `state` (text) - State/Province name
      - `city` (text) - City name
      - `facility` (text) - Hospital/Facility name
      - `website` (text, nullable) - Customer's website
      - `product_service` (text) - Product/Service interested in
      - `reason` (text) - Reason for consultation (Job/Sales Inquiry)
      - `preferred_date` (date) - Preferred consultation date
      - `preferred_time` (text) - Preferred time slot in customer's timezone
      - `timezone` (text) - Timezone display name
      - `timezone_value` (text) - IANA timezone identifier
      - `ist_time` (text, nullable) - Converted time in IST
      - `status` (text) - Booking status (Pending/Reviewed/Scheduled/Completed/Cancelled)
      - `notes` (text, nullable) - Admin notes
      - `created_at` (timestamptz) - Submission timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `consultancy_bookings_v2` table
    - Add policy for anonymous users to insert bookings
    - Add policy for authenticated admins to read all bookings
    - Add policy for authenticated admins to update bookings
    - Add policy for authenticated admins to delete bookings
*/

-- Create the new consultancy bookings table
CREATE TABLE IF NOT EXISTS consultancy_bookings_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  facility text NOT NULL,
  website text,
  product_service text NOT NULL,
  reason text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  timezone text NOT NULL,
  timezone_value text NOT NULL,
  ist_time text,
  status text NOT NULL DEFAULT 'Pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE consultancy_bookings_v2 ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous users to insert bookings
CREATE POLICY "Anyone can submit bookings"
  ON consultancy_bookings_v2
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy for admins to read all bookings
CREATE POLICY "Admins can read all bookings"
  ON consultancy_bookings_v2
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy for admins to update bookings
CREATE POLICY "Admins can update bookings"
  ON consultancy_bookings_v2
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policy for admins to delete bookings
CREATE POLICY "Admins can delete bookings"
  ON consultancy_bookings_v2
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_consultancy_bookings_v2_created_at 
  ON consultancy_bookings_v2(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultancy_bookings_v2_status 
  ON consultancy_bookings_v2(status);

CREATE INDEX IF NOT EXISTS idx_consultancy_bookings_v2_email 
  ON consultancy_bookings_v2(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consultancy_bookings_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_consultancy_bookings_v2_updated_at
  BEFORE UPDATE ON consultancy_bookings_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_consultancy_bookings_v2_updated_at();
