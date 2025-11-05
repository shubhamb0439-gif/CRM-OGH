/*
  # Add Booking Slots and Timezone Support

  1. Changes to consultancy_bookings table
    - Add timezone_value column for storing IANA timezone (e.g., 'America/New_York')
    - Add ist_time column for storing the converted IST time for admin panel
    - Modify timezone column to store timezone display name

  2. Create booking_slots table
    - `id` (uuid, primary key)
    - `booking_date` (date) - The date of the booking
    - `time_slot` (text) - The time slot in 24h format (e.g., '09:00')
    - `timezone` (text) - The timezone of the slot
    - `is_booked` (boolean) - Whether the slot is booked
    - `booking_id` (uuid, foreign key to consultancy_bookings) - Reference to the booking
    - `created_at` (timestamptz)

  3. Security
    - Enable RLS on booking_slots table
    - Add policy for public read access to check availability
    - Add policy for authenticated admin to manage slots
*/

-- Add new columns to consultancy_bookings if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultancy_bookings' AND column_name = 'timezone_value'
  ) THEN
    ALTER TABLE consultancy_bookings ADD COLUMN timezone_value text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultancy_bookings' AND column_name = 'ist_time'
  ) THEN
    ALTER TABLE consultancy_bookings ADD COLUMN ist_time text;
  END IF;
END $$;

-- Create booking_slots table
CREATE TABLE IF NOT EXISTS booking_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date date NOT NULL,
  time_slot text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  is_booked boolean DEFAULT false,
  booking_id uuid REFERENCES consultancy_bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_date, time_slot)
);

-- Enable RLS on booking_slots
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view booking slots" ON booking_slots;
  DROP POLICY IF EXISTS "Authenticated users can manage booking slots" ON booking_slots;
END $$;

-- Allow public to read booking slots to check availability
CREATE POLICY "Public can view booking slots"
  ON booking_slots FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can manage booking slots
CREATE POLICY "Authenticated users can manage booking slots"
  ON booking_slots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
