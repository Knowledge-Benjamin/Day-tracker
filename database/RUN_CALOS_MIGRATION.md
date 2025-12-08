# Running Calos AI Database Migration on Neon

## Connection String

```bash
<YOUR_DATABASE_URL>
```

## Option 1: Using Neon Console (Recommended)

1. Go to https://console.neon.tech/
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy the contents of `database/calos_migration.sql`
5. Paste and click **Run**
6. Verify the results

## Option 2: Using psql Command Line

```bash
# Run migration
psql "<YOUR_DATABASE_URL>" -f database/calos_migration.sql

# Verify tables were created
psql "<YOUR_DATABASE_URL>" -c "\dt ai_*"
```

## Option 3: Using Node.js Script

```bash
cd server
node -e "
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const sql = fs.readFileSync('../database/calos_migration.sql', 'utf8');
  await pool.query(sql);
  console.log('Migration completed!');
  await pool.end();
})();
"
```

## Tables to be Created

1. **ai_conversations** - Chat history with users
   - Stores all messages (user + assistant)
   - Includes audio URLs, intents, entities
   - Indexed by user_id, session_id, created_at

2. **ai_context** - User preferences and learned patterns
   - One row per user
   - Stores preferences (voice/text, greeting times)
   - Learned behaviors and patterns

3. **ai_pending_actions** - Actions awaiting approval
   - Draft emails, scheduled tasks
   - Status: pending/approved/rejected
   - Indexed by user and status

4. **ai_external_sync** - OAuth tokens for external services
   - Gmail, Twitter, Google Calendar
   - Sync tokens and credentials
   - One row per user per service

## Verification

After running the migration, verify with:

```sql
-- List all AI tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%'
ORDER BY table_name;

-- Expected output:
--  ai_context
--  ai_conversations
--  ai_external_sync
--  ai_pending_actions
```

## Next Steps

Once migration is complete:
1. ✅ Calos AI backend is deployed (https://calos-ai.onrender.com)
2. ✅ Database tables created
3. ➡️ **Start mobile app integration** (Phase 2: Install dependencies)
