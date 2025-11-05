/*
  # Drop Old Consultancy Bookings Table

  1. Changes
    - Drop the old consultancy_bookings table
    - All functionality now uses consultancy_bookings_v2

  2. Cleanup
    - Remove unused table
    - Keep consultancy_bookings_v2 as the active table
*/

-- Drop the old table
DROP TABLE IF EXISTS consultancy_bookings CASCADE;
