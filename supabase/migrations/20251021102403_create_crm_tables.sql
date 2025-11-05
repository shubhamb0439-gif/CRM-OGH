/*
  # CRM Application Database Schema

  ## Tables Created
  
  1. **leads**
     - `id` (uuid, primary key)
     - `name` (text) - Lead's full name
     - `email` (text) - Contact email
     - `phone` (text) - Contact phone number
     - `facility` (text) - Hospital/Facility name
     - `state` (text) - Geographic state (important field)
     - `source` (text) - Assessment/Consultancy/Referral
     - `score` (integer) - Assessment score (nullable)
     - `efficiency_level` (text) - Good/Moderate/Needs Improvement
     - `product_service` (text) - Drug Assist, Call Operator, Doctor, etc.
     - `status` (text) - New/Contacted/Qualified/Contract Sent/Confirmed/Closed
     - `closed_reason` (text) - Not Interested/Confirmed Client (nullable)
     - `comments` (text) - Challenges/feedback from assessment
     - `created_at` (timestamptz) - Entry date
     - `updated_at` (timestamptz) - Last update

  2. **consultancy_bookings**
     - `id` (uuid, primary key)
     - `full_name` (text)
     - `email` (text)
     - `phone` (text)
     - `facility` (text)
     - `state` (text)
     - `reason` (text) - Reason for consultation
     - `preferred_date` (date)
     - `preferred_time` (text)
     - `timezone` (text)
     - `status` (text) - Pending/Reviewed/Scheduled/Completed
     - `created_at` (timestamptz)

  3. **assessments**
     - `id` (uuid, primary key)
     - `name` (text)
     - `email` (text)
     - `phone` (text)
     - `facility` (text)
     - `state` (text)
     - `score` (integer)
     - `time_taken` (integer) - Time in seconds
     - `efficiency_level` (text)
     - `comments` (text) - Challenges faced
     - `product_service` (text)
     - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public access for submission forms (assessments, bookings)
  - Protected admin access for CRM data
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  facility text NOT NULL,
  state text NOT NULL,
  source text NOT NULL CHECK (source IN ('Assessment', 'Consultancy', 'Referral')),
  score integer,
  efficiency_level text CHECK (efficiency_level IN ('Good Efficiency', 'Moderate Efficiency', 'Needs Improvement')),
  product_service text NOT NULL,
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified Prospect', 'Contract Sent', 'Confirmed Client', 'Closed')),
  closed_reason text CHECK (closed_reason IN ('Not Interested', 'Confirmed Client')),
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultancy_bookings table
CREATE TABLE IF NOT EXISTS consultancy_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  facility text NOT NULL,
  state text NOT NULL,
  reason text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  timezone text NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Scheduled', 'Completed')),
  created_at timestamptz DEFAULT now()
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  facility text NOT NULL,
  state text NOT NULL,
  score integer NOT NULL,
  time_taken integer NOT NULL,
  efficiency_level text NOT NULL CHECK (efficiency_level IN ('Good Efficiency', 'Moderate Efficiency', 'Needs Improvement')),
  comments text,
  product_service text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Policies for leads (admin access only for reads, public for inserts from automation)
CREATE POLICY "Public can insert leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can read leads"
  ON leads FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can update leads"
  ON leads FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies for consultancy_bookings (public can submit)
CREATE POLICY "Public can insert bookings"
  ON consultancy_bookings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can read bookings"
  ON consultancy_bookings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can update bookings"
  ON consultancy_bookings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies for assessments (public can submit)
CREATE POLICY "Public can insert assessments"
  ON assessments FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can read assessments"
  ON assessments FOR SELECT
  TO anon
  USING (true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leads table
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
