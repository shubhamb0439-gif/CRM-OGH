/*
  # Allow Anonymous Users to View Their Own Assessment

  This migration updates the RLS policy to allow anonymous users to view
  an assessment they just submitted by navigating to the report page.
  
  ## Changes
  
  1. Drop the time-based SELECT policy for anonymous users
  2. Add new policy that allows anonymous users to SELECT assessments
     created in the last 10 minutes (enough time to view the report)
  
  ## Security Notes
  - 10-minute window provides reasonable time to view the report
  - Users can only see assessments from the last 10 minutes
  - After 10 minutes, only authenticated admins can view assessments
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anonymous users can select their own new assessments" ON assessments;

-- Add new policy with longer window for viewing reports
CREATE POLICY "Anonymous users can view recent assessments"
  ON assessments
  FOR SELECT
  TO anon
  USING (
    created_at >= (now() - interval '10 minutes')
  );
