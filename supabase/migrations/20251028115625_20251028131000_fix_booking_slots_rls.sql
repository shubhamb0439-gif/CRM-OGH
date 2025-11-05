/*
  # Fix Booking Slots RLS Policies

  1. Changes
    - Add policy to allow anonymous users to insert booking slots
    - This is needed when consultancy bookings are created from public form

  2. Security
    - Maintain admin-only access for viewing, updating, and deleting
    - Allow anyone (anon + authenticated) to insert booking slots
*/

CREATE POLICY "Anyone can insert booking slots"
  ON booking_slots
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
