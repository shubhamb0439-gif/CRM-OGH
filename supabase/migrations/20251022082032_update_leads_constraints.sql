/*
  # Update Leads Table Constraints

  ## Changes
  - Update efficiency_level constraint to include emoji-based values
  - Update source constraint to include new sources: LinkedIn, WhatsApp, Call, Email
  
  ## Important Notes
  - Supports new lead sources from updated Add Lead modal
  - Maintains backward compatibility with existing data
*/

-- Update efficiency_level constraint
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS leads_efficiency_level_check;

ALTER TABLE leads 
ADD CONSTRAINT leads_efficiency_level_check 
CHECK (efficiency_level IN (
  '🌟 Excellent Efficiency',
  '👍 Good Efficiency',
  '⚙️ Moderate Efficiency',
  '⚠️ Needs Improvement',
  'Good Efficiency',
  'Moderate Efficiency',
  'Needs Improvement'
) OR efficiency_level IS NULL);

-- Update source constraint
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS leads_source_check;

ALTER TABLE leads 
ADD CONSTRAINT leads_source_check 
CHECK (source IN (
  'Assessment',
  'Consultancy',
  'LinkedIn',
  'WhatsApp',
  'Call',
  'Email',
  'Referral'
));