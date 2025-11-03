CREATE OR REPLACE FUNCTION public.create_user(
    email text,
    username text,
    password text,
    is_admin boolean
) RETURNS uuid AS $$
  declare
  user_id uuid;
  encrypted_pw text;
BEGIN
  user_id := gen_random_uuid();
  encrypted_pw := crypt(password, gen_salt('bf'));
  
  INSERT INTO auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    ('00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', email, encrypted_pw, '2023-05-03 19:41:43.585805+00', '2023-04-22 13:10:03.275387+00', '2023-04-22 13:10:31.458239+00', '{"provider":"email","providers":["email"]}', '{}', '2023-05-03 19:41:43.580424+00', '2023-05-03 19:41:43.585948+00', '', '', '', '');
    
  INSERT INTO auth.identities (provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (user_id, gen_random_uuid(), user_id, format('{"sub":"%s","email":"%s"}', user_id::text, email)::jsonb, 'email', '2023-05-03 19:41:43.582456+00', '2023-05-03 19:41:43.582497+00', '2023-05-03 19:41:43.582497+00');

  INSERT INTO public.profiles (id, username, role)
  VALUES
  (user_id, username,
  CASE WHEN is_admin THEN 'ADMIN'::user_role ELSE 'USER'::user_role END);

  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Capture user IDs in variables for further seeding
DO $$
DECLARE
  admin_id uuid;
  tester1_id uuid;
  tester2_id uuid;
  tester3_id uuid;
  tester4_id uuid;
BEGIN
  admin_id := public.create_user('admin@example.com', 'admin', 'Qwerty1234', true);
  tester1_id := public.create_user('tester1@example.com', 'tester1', 'Qwerty1234', false);
  tester2_id := public.create_user('tester2@example.com', 'tester2', 'Qwerty1234', false);
  tester3_id := public.create_user('tester3@example.com', 'tester3', 'Qwerty1234', false);
  tester4_id := public.create_user('tester4@example.com', 'tester4', 'Qwerty1234', false);

  RAISE NOTICE 'Admin ID: %, Tester IDs: %, %, %, %', admin_id, tester1_id, tester2_id, tester3_id, tester4_id;
END $$;