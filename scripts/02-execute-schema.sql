-- Start with extensions and types
-- (Content of database/01-extensions-and-types.sql)
-- Example:
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "moddatetime"; -- For updated_at triggers

    CREATE TYPE public.user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- End of 01-extensions-and-types.sql

-- Then core tables
-- (Content of database/02-core-tables.sql)
-- Example:
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- End of 02-core-tables.sql

-- ... (Include content of 03-content-tables.sql) ...
-- ... (Include content of 04-commerce-tables.sql) ...
-- ... (Include content of 05-social-tables.sql) ...
-- ... (Include content of 06-events-tables.sql) ...

-- Then the community schema (ensure this is the correct and complete one)
-- (Content of database/12-community-schema.sql or database/community-schema.sql)
-- Example from 12-community-schema.sql:
CREATE TABLE IF NOT EXISTS community_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ... (rest of 12-community-schema.sql, including community_comments, community_comment_likes, community_reports) ...

-- Then indexes and performance
-- (Content of database/07-indexes-and-performance.sql)

-- Then functions and triggers
-- (Content of database/08-functions-and-triggers.sql)

-- Then RLS policies
-- (Content of database/09-rls-policies.sql)

-- Then seed data
-- (Content of database/10-seed-data.sql)

-- Then test users if applicable
-- (Content of database/11-create-test-users.sql)


-- Finally, verify tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
