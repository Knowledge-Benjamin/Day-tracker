require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Connected to database...');

        console.log('Adding google_calendar_event_id to daily_logs...');
        await client.query('ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);');

        console.log('Adding google_calendar_event_id to log_future_plans...');
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
