-- Day Tracker Database Schema
-- PostgreSQL

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS log_future_plans CASCADE;
DROP TABLE IF EXISTS log_good_things CASCADE;
DROP TABLE IF EXISTS log_activities CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS sync_queue CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP
);

-- Goals table
CREATE TABLE goals (
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
    client_id VARCHAR(255) UNIQUE -- For offline sync
);

-- Daily logs table
CREATE TABLE daily_logs (
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

-- Log activities (free-form)
CREATE TABLE log_activities (
    id SERIAL PRIMARY KEY,
    daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    activity TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_id VARCHAR(255) UNIQUE
);

-- Log good things
CREATE TABLE log_good_things (
    id SERIAL PRIMARY KEY,
    daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_id VARCHAR(255) UNIQUE
);

-- Log future plans
CREATE TABLE log_future_plans (
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

-- Attachments (photos, files)
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_id VARCHAR(255) UNIQUE
);

-- Sync queue for offline-first architecture
CREATE TABLE sync_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'goal', 'daily_log', 'activity', etc.
    entity_id VARCHAR(255) NOT NULL, -- client_id
    operation VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    data JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'synced', 'conflict'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_active ON goals(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_daily_logs_goal_id ON daily_logs(goal_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX idx_activities_log_id ON log_activities(daily_log_id);
CREATE INDEX idx_good_things_log_id ON log_good_things(daily_log_id);
CREATE INDEX idx_future_plans_log_id ON log_future_plans(daily_log_id);
CREATE INDEX idx_attachments_log_id ON attachments(daily_log_id);
CREATE INDEX idx_sync_queue_user_status ON sync_queue(user_id, status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
