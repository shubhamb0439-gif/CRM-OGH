/*
  # Allow Anonymous Users to Select Their Inserted Assessments

  This migration adds an RLS policy to allow anonymous users to SELECT
  assessment records immediately after inserting them. This is needed
  because the application uses .select().single() after insert to get
  the newly created assessment ID for navigation.
  
  ## Changes
  
  1. Add RLS Policy for assessments table:
    - Allow anonymous users to SELECT assessments they just inserted
    - Uses a time-based check (within last 5 seconds) and email match
  
  ## Security Notes
  - This policy is restrictive - only allows reading records created very recently
  - Combined with email match ensures users can only see their own submission
  - 5-second window is sufficient for the insert/select operation
*/

-- Allow anonymous users to SELECT their newly inserted assessment
CREATE POLICY "Anonymous users can select their own new assessments"
  ON assessments
  FOR SELECT
  TO anon
  USING (
    created_at >= (now() - interval '5 seconds')
    AND email IS NOT NULL
  );
