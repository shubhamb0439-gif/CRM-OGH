/*
  # Update Efficiency Level Constraint

  ## Changes
  - Drop old efficiency_level check constraint
  - Add new constraint with emoji-based efficiency levels:
    - '🌟 Excellent Efficiency'
    - '👍 Good Efficiency'
    - '⚙️ Moderate Efficiency'
    - '⚠️ Needs Improvement'
  - Maintains backward compatibility with old values

  ## Important Notes
  - Updates assessments table constraint to support new 100-point scoring system
  - Allows both old and new efficiency level formats
*/

-- Drop the old constraint
ALTER TABLE assessments 
DROP CONSTRAINT IF EXISTS assessments_efficiency_level_check;

-- Add new constraint with updated values
ALTER TABLE assessments 
ADD CONSTRAINT assessments_efficiency_level_check 
CHECK (efficiency_level IN (
  '🌟 Excellent Efficiency',
  '👍 Good Efficiency',
  '⚙️ Moderate Efficiency',
  '⚠️ Needs Improvement',
  'Good Efficiency',
  'Moderate Efficiency',
  'Needs Improvement'
));