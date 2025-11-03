CREATE OR REPLACE FUNCTION public.create_user(
        email text,
        username text,
        password text,
        is_admin boolean
    ) RETURNS uuid AS $$
declare user_id uuid;
encrypted_pw text;
BEGIN user_id := gen_random_uuid();
encrypted_pw := crypt(password, gen_salt('bf'));
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
    )
VALUES (
        '00000000-0000-0000-0000-000000000000',
        user_id,
        'authenticated',
        'authenticated',
        email,
        encrypted_pw,
        '2023-05-03 19:41:43.585805+00',
        '2023-04-22 13:10:03.275387+00',
        '2023-04-22 13:10:31.458239+00',
        '{"provider":"email","providers":["email"]}',
        '{}',
        '2023-05-03 19:41:43.580424+00',
        '2023-05-03 19:41:43.585948+00',
        '',
        '',
        '',
        ''
    );
INSERT INTO auth.identities (
        provider_id,
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
VALUES (
        user_id,
        gen_random_uuid(),
        user_id,
        format(
            '{"sub":"%s","email":"%s"}',
            user_id::text,
            email
        )::jsonb,
        'email',
        '2023-05-03 19:41:43.582456+00',
        '2023-05-03 19:41:43.582497+00',
        '2023-05-03 19:41:43.582497+00'
    );
INSERT INTO public.profiles (id, username, role)
VALUES (
        user_id,
        username,
        CASE
            WHEN is_admin THEN 'ADMIN'::user_role
            ELSE 'USER'::user_role
        END
    );
RETURN user_id;
END;
$$ LANGUAGE plpgsql;
-- Capture user IDs in variables for further seeding
DO $$
DECLARE admin_id uuid;
tester1_id uuid;
tester2_id uuid;
tester3_id uuid;
tester4_id uuid;
BEGIN admin_id := public.create_user('admin@example.com', 'admin', 'Qwerty1234', true);
tester1_id := public.create_user(
    'tester1@example.com',
    'tester1',
    'Qwerty1234',
    false
);
tester2_id := public.create_user(
    'tester2@example.com',
    'tester2',
    'Qwerty1234',
    false
);
tester3_id := public.create_user(
    'tester3@example.com',
    'tester3',
    'Qwerty1234',
    false
);
tester4_id := public.create_user(
    'tester4@example.com',
    'tester4',
    'Qwerty1234',
    false
);
RAISE NOTICE 'Admin ID: %, Tester IDs: %, %, %, %',
admin_id,
tester1_id,
tester2_id,
tester3_id,
tester4_id;
-- Insert 20 realistic tickets for project workflow
-- Status distribution: 8 OPEN (40%), 7 IN_PROGRESS (35%), 5 CLOSED (25%)
-- Type distribution: 8 BUG (40%), 7 IMPROVEMENT (35%), 5 TASK (25%)
-- Reporter distribution: ~10 by admin, ~10 by testers, 3 with NULL (deleted accounts)
-- Assignment: Minority to admin, majority to testers, some OPEN unassigned, all IN_PROGRESS/CLOSED assigned
-- OPEN tickets (8)
INSERT INTO public.tickets (
        title,
        description,
        type,
        status,
        reporter_id,
        assignee_id,
        ai_enhanced
    )
VALUES (
        'Login button not responsive on mobile',
        'The login button on the mobile interface is not clickable and does not respond to user taps. Affects all iOS and Android users.',
        'BUG',
        'OPEN',
        admin_id,
        NULL,
        false
    ),
    (
        'Add dark mode support to application',
        'Implement a dark mode theme for the entire application to reduce eye strain and improve user experience for evening users.',
        'IMPROVEMENT',
        'OPEN',
        admin_id,
        NULL,
        false
    ),
    (
        'Update user documentation for recent changes',
        'Review and update all user-facing documentation to reflect recent UI and feature changes implemented in the last sprint.',
        'TASK',
        'OPEN',
        admin_id,
        tester1_id,
        false
    ),
    (
        'Database connection timeout under load',
        'Connection pool exhausts under heavy concurrent load causing connection timeouts and service degradation. Performance degrades significantly during peak hours.',
        'BUG',
        'OPEN',
        admin_id,
        tester2_id,
        false
    ),
    (
        'Implement email notification system',
        'Add comprehensive email notification system for important user actions, account changes, and platform updates. Should support multiple notification types.',
        'IMPROVEMENT',
        'OPEN',
        tester1_id,
        NULL,
        false
    ),
    (
        'Fix spelling and grammar errors in UI',
        'Correct multiple typos and grammatical errors found throughout the user interface and help sections during QA review.',
        'BUG',
        'OPEN',
        tester2_id,
        NULL,
        false
    ),
    (
        'Create comprehensive API documentation',
        'Write detailed and comprehensive API documentation for all public endpoints including request examples, response formats, and error codes.',
        'TASK',
        'OPEN',
        tester3_id,
        tester4_id,
        false
    ),
    (
        'Add full-text search functionality',
        'Implement a robust full-text search feature across all content types to help users find relevant information more efficiently and quickly.',
        'IMPROVEMENT',
        'OPEN',
        NULL,
        tester1_id,
        false
    ),
    -- IN_PROGRESS tickets (7)
    (
        'Memory leak in background sync service',
        'Investigate and fix critical memory leak occurring in the background sync service that causes memory usage to grow indefinitely over time.',
        'BUG',
        'IN_PROGRESS',
        admin_id,
        tester1_id,
        false
    ),
    (
        'Redesign dashboard with modern layout',
        'Modernize the main dashboard interface with a new responsive grid-based layout to improve usability and visual hierarchy.',
        'IMPROVEMENT',
        'IN_PROGRESS',
        admin_id,
        tester2_id,
        false
    ),
    (
        'Implement user behavior analytics',
        'Add analytics tracking and comprehensive reporting for user behavior, platform usage patterns, and feature adoption metrics.',
        'TASK',
        'IN_PROGRESS',
        admin_id,
        tester3_id,
        false
    ),
    (
        'Resolve CSS styling issues on forms',
        'Fix CSS layout and styling issues causing form element misalignment on Firefox and Safari browsers.',
        'BUG',
        'IN_PROGRESS',
        tester1_id,
        tester4_id,
        false
    ),
    (
        'Add PDF export functionality',
        'Enable users to export reports, generated documents, and user data in PDF format with proper formatting and branding.',
        'IMPROVEMENT',
        'IN_PROGRESS',
        tester2_id,
        tester1_id,
        false
    ),
    (
        'Fix session timeout mechanism',
        'Fix broken session timeout functionality that is not properly terminating inactive user sessions after the configured timeout period.',
        'BUG',
        'IN_PROGRESS',
        tester3_id,
        tester2_id,
        false
    ),
    (
        'Set up system monitoring and alerts',
        'Configure comprehensive system monitoring infrastructure and alerting system for critical performance metrics and service health.',
        'TASK',
        'IN_PROGRESS',
        NULL,
        admin_id,
        false
    ),
    -- CLOSED tickets (5)
    (
        'Avatar upload functionality restored',
        'Fixed issue preventing users from uploading profile avatar images. Issue was caused by incorrect file type validation logic.',
        'BUG',
        'CLOSED',
        admin_id,
        tester1_id,
        false
    ),
    (
        'Deploy release to production server',
        'Successfully deployed version 2.1.0 to the production environment with zero downtime using blue-green deployment strategy.',
        'TASK',
        'CLOSED',
        admin_id,
        tester2_id,
        false
    ),
    (
        'Two-factor authentication system implemented',
        'Implemented secure two-factor authentication system supporting both TOTP authenticator apps and SMS-based verification for enhanced account security.',
        'IMPROVEMENT',
        'CLOSED',
        tester1_id,
        tester3_id,
        false
    ),
    (
        'Email validation regex corrected',
        'Fixed email validation regular expression to properly support international domain names and modern email formats.',
        'BUG',
        'CLOSED',
        NULL,
        tester4_id,
        false
    ),
    (
        'Database query performance optimized by 40%',
        'Optimized critical database queries through indexing strategy and query restructuring, achieving 40% improvement in response times.',
        'IMPROVEMENT',
        'CLOSED',
        tester2_id,
        admin_id,
        false
    );
END $$;