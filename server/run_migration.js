require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Render
    }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Connected to database...');
        console.log('Running schema migration...');

        // 1. Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_sync_at TIMESTAMP
            );
        `);

        // 2. Goals table
        await client.query(`
            CREATE TABLE IF NOT EXISTS goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                start_date DATE NOT NULL,
                duration_days INTEGER NOT NULL,
                end_date DATE GENERATED ALWAYS AS (start_date + duration_days) STORED,
                color VARCHAR(7) DEFAULT '#FFFFFF',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP,
                client_id VARCHAR(255) UNIQUE
            );
        `);

        // 3. Daily logs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS daily_logs (
                id SERIAL PRIMARY KEY,
                goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                log_date DATE NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP,
                client_id VARCHAR(255) UNIQUE,
                UNIQUE(goal_id, log_date)
            );
        `);

        // 4. Log activities
        await client.query(`
            CREATE TABLE IF NOT EXISTS log_activities (
                id SERIAL PRIMARY KEY,
                daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
                activity TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                client_id VARCHAR(255) UNIQUE
            );
        `);

        // 5. Log good things
        await client.query(`
            CREATE TABLE IF NOT EXISTS log_good_things (
                id SERIAL PRIMARY KEY,
                daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                client_id VARCHAR(255) UNIQUE
            );
        `);

        // 6. Log future plans
        await client.query(`
            CREATE TABLE IF NOT EXISTS log_future_plans (
                id SERIAL PRIMARY KEY,
                daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                planned_date TIMESTAMP,
                google_calendar_event_id VARCHAR(255),
                reminder_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                client_id VARCHAR(255) UNIQUE
            );
        `);

        // 7. Attachments
        await client.query(`
            CREATE TABLE IF NOT EXISTS attachments (
                id SERIAL PRIMARY KEY,
                daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(100),
                file_size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                client_id VARCHAR(255) UNIQUE
            );
        `);

        // 8. Sync queue
        await client.query(`
            CREATE TABLE IF NOT EXISTS sync_queue (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                entity_type VARCHAR(50) NOT NULL,
                entity_id VARCHAR(255) NOT NULL,
                operation VARCHAR(20) NOT NULL,
                data JSONB,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                synced_at TIMESTAMP
            );
        `);

        // 9. Indexes (IF NOT EXISTS is not standard for CREATE INDEX in older Postgres, but works in newer. 
        // We'll use a helper or just try/catch or use IF NOT EXISTS if supported. 
        // Render usually runs recent Postgres. IF NOT EXISTS is supported in PG 9.5+)
        const createIndex = async (query) => {
            try {
                await client.query(query);
            } catch (e) {
                // Ignore "relation already exists" error
                if (e.code !== '42P07') console.warn('Index creation warning:', e.message);
            }
        };

        await createIndex('CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);');
        await createIndex('CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(is_active) WHERE deleted_at IS NULL;');
        await createIndex('CREATE INDEX IF NOT EXISTS idx_daily_logs_goal_id ON daily_logs(goal_id);');
        await createIndex('CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date);');
        await createIndex('CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);');
        await createIndex('CREATE INDEX IF NOT EXISTS idx_activities_log_id ON log_activities(daily_log_id);');
        await createIndex('CREATE INDEX IF NOT EXISTS idx_good_things_log_id ON log_good_things(daily_log_id);');
        await createIndex('CREATE INDEX IF NOT EXISTS idx_future_plans_log_id ON log_future_plans(daily_log_id);');
        await createIndex('CREATE INDEX IF NOT EXISTS idx_attachments_log_id ON attachments(daily_log_id);');
        await createIndex('CREATE INDEX IF NOT EXISTS idx_sync_queue_user_status ON sync_queue(user_id, status);');

        // 10. Update function and triggers
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        const createTrigger = async (triggerName, tableName) => {
            try {
                // Drop first to ensure we can recreate (or check existence)
                await client.query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};`);
                await client.query(`
                    CREATE TRIGGER ${triggerName} BEFORE UPDATE ON ${tableName}
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                `);
            } catch (e) {
                console.warn(`Trigger creation warning for ${triggerName}:`, e.message);
            }
        };

        await createTrigger('update_users_updated_at', 'users');
        await createTrigger('update_goals_updated_at', 'goals');
        await createTrigger('update_daily_logs_updated_at', 'daily_logs');

        // 11. Schema Evolutions (Adding missing columns if table existed but column didn't)
        console.log('Checking for schema updates...');

        await client.query('ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);');
        await client.query('ALTER TABLE log_future_plans ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);');

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
