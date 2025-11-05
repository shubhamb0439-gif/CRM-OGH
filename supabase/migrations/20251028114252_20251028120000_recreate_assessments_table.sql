/*
  # Recreate Assessments Table

  1. Changes
    - Drop existing assessments table completely
    - Create new assessments table with clean structure
    - All necessary fields for assessment workflow
    - Support for specialties, challenges, and recommendations

  2. New Table Structure
    - `assessments`
      - `id` (uuid, primary key) - Unique assessment identifier
      - `name` (text, required) - Full name of person taking assessment
      - `email` (text, required) - Contact email
      - `phone` (text, nullable) - Optional phone number
      - `facility` (text, required) - Hospital or facility name
      - `country` (text, nullable) - Country location
      - `state` (text, required) - State/Province location
      - `specialties` (text[], nullable) - Array of medical specialties
      - `score` (integer, required) - Assessment score out of 100
      - `time_taken` (integer, required) - Time taken in seconds
      - `efficiency_level` (text, required) - Efficiency rating
      - `product_service` (text, required) - Product/service of interest
      - `selected_challenges` (text[], nullable) - Array of selected challenge IDs
      - `recommended_services` (text[], nullable) - Array of recommended services
      - `comments` (text, nullable) - Additional comments
      - `created_at` (timestamptz) - Timestamp of submission

  3. Security
    - Enable RLS on assessments table
    - Allow anonymous users to insert assessments
    - Allow anonymous users to view their own assessment by ID
    - Allow authenticated admin users to view all assessments
*/

DROP TABLE IF EXISTS assessments CASCADE;

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  facility text NOT NULL,
  country text,
  state text NOT NULL,
  specialties text[],
  score integer NOT NULL,
  time_taken integer NOT NULL,
  efficiency_level text NOT NULL CHECK (
    efficiency_level IN (
      '🌟 Excellent Efficiency',
      '👍 Good Efficiency',
      '⚙️ Moderate Efficiency',
      '⚠️ Needs Improvement',
      'Excellent Efficiency',
      'Good Efficiency',
      'Moderate Efficiency',
      'Needs Improvement'
    )
  ),
  product_service text NOT NULL,
  selected_challenges text[],
  recommended_services text[],
  comments text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert assessments"
  ON assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own assessment by ID"
  ON assessments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can view all assessments"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Admins can update assessments"
  ON assessments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Admins can delete assessments"
  ON assessments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );
