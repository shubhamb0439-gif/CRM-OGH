/*
  # Add Product Service, Country, and City to Consultancy Bookings

  This migration adds new fields to track product/service interest, country, and city
  for consultancy bookings.
  
  ## Changes
  
  1. New Columns Added to consultancy_bookings:
    - `product_service` (text, nullable) - The product/service the user is interested in
    - `country` (text, nullable) - The country of the booking
    - `city` (text, nullable) - The city of the booking
  
  ## Notes
  - These fields are nullable to maintain compatibility with existing records
  - Future bookings should populate these fields
*/

-- Add product_service column to consultancy_bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultancy_bookings' AND column_name = 'product_service'
  ) THEN
    ALTER TABLE consultancy_bookings ADD COLUMN product_service text;
  END IF;
END $$;

-- Add country column to consultancy_bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultancy_bookings' AND column_name = 'country'
  ) THEN
    ALTER TABLE consultancy_bookings ADD COLUMN country text;
  END IF;
END $$;

-- Add city column to consultancy_bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultancy_bookings' AND column_name = 'city'
  ) THEN
    ALTER TABLE consultancy_bookings ADD COLUMN city text;
  END IF;
END $$;
