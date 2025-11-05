/*
  # Update RLS Policies for Admin Access

  1. Changes
    - Update RLS policies on all tables to allow authenticated admin users full access
    - Admin users are identified by their email being in the admin_users table
    
  2. Security
    - Only authenticated users whose email exists in admin_users table can access data
    - All tables remain protected by RLS
    - Non-admin authenticated users have no access
    - Public users can still submit forms (insert only)
*/

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt()->>'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing policies
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, tablename, policyname 
            FROM pg_policies 
            WHERE schemaname = 'public') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
  END LOOP;
END $$;

-- Admin users table policies
CREATE POLICY "Admins can read admin list"
  ON admin_users FOR SELECT
  TO authenticated
  USING (is_admin());

-- Leads table policies
CREATE POLICY "Admins can read leads"
  ON leads FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Public can insert leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Consultancy bookings policies
CREATE POLICY "Admins can read bookings"
  ON consultancy_bookings FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update bookings"
  ON consultancy_bookings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete bookings"
  ON consultancy_bookings FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Public can insert bookings"
  ON consultancy_bookings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Assessments table policies
CREATE POLICY "Admins can read assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update assessments"
  ON assessments FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete assessments"
  ON assessments FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Public can insert assessments"
  ON assessments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Campaigns policies
CREATE POLICY "Admins can read campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (is_admin());

-- Booking slots policies
CREATE POLICY "Admins can read booking slots"
  ON booking_slots FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert booking slots"
  ON booking_slots FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update booking slots"
  ON booking_slots FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete booking slots"
  ON booking_slots FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Public can read booking slots"
  ON booking_slots FOR SELECT
  TO anon
  USING (true);

-- Products and services policies
CREATE POLICY "Admins can read products_services"
  ON products_services FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert products_services"
  ON products_services FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products_services"
  ON products_services FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products_services"
  ON products_services FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Public can read products_services"
  ON products_services FOR SELECT
  TO anon
  USING (is_active = true);

-- Products and innovation policies
CREATE POLICY "Admins can read products_and_innovation"
  ON products_and_innovation FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert products_and_innovation"
  ON products_and_innovation FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products_and_innovation"
  ON products_and_innovation FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products_and_innovation"
  ON products_and_innovation FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Public can read products_and_innovation"
  ON products_and_innovation FOR SELECT
  TO anon
  USING (is_active = true);
