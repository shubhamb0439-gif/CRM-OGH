/*
  # Fix Admin Account Passwords

  1. Changes
    - Delete existing admin auth records
    - Recreate admin accounts with proper password encryption
    
  2. Admin Accounts
    - sp@oghealthcare.com (password: 9845009748)
    - sagnik.ghosh@oghealthcare.com (password: 7829659177)
    - aphales@oghealthcare.com (password: 9845222628)
*/

-- Delete existing auth records for these emails
DELETE FROM auth.users WHERE email IN (
  'sp@oghealthcare.com',
  'sagnik.ghosh@oghealthcare.com',
  'aphales@oghealthcare.com'
);

-- Create admin users with proper password hashing
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Admin 1: sp@oghealthcare.com
  user_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    'sp@oghealthcare.com',
    crypt('9845009748', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    user_id::text,
    format('{"sub":"%s","email":"%s"}', user_id::text, 'sp@oghealthcare.com')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Admin 2: sagnik.ghosh@oghealthcare.com
  user_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    'sagnik.ghosh@oghealthcare.com',
    crypt('7829659177', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    user_id::text,
    format('{"sub":"%s","email":"%s"}', user_id::text, 'sagnik.ghosh@oghealthcare.com')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Admin 3: aphales@oghealthcare.com
  user_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    'aphales@oghealthcare.com',
    crypt('9845222628', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    user_id::text,
    format('{"sub":"%s","email":"%s"}', user_id::text, 'aphales@oghealthcare.com')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );
END $$;
