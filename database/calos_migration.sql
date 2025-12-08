-- Calos AI Database Migration for Neon
-- Run this script on your Neon database to add AI tables
-- Connection: postgresql://neondb_owner:npg_IOfrh4Vpz3Wa@ep-lively-dew-ad0veyh7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

-- ============================================
-- AI CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'assistant')),
    content TEXT NOT NULL,
    audio_url TEXT,
    intent VARCHAR(100),
    entities JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);

COMMENT ON TABLE ai_conversations IS 'Stores all AI conversations with indefinite history';
COMMENT ON COLUMN ai_conversations.message_type IS 'Type of message: user or assistant';
COMMENT ON COLUMN ai_conversations.audio_url IS 'URL to audio file if voice message';
COMMENT ON COLUMN ai_conversations.intent IS 'Detected intent from conversation';
COMMENT ON COLUMN ai_conversations.entities IS 'Extracted entities in JSON format';

-- ============================================
-- AI CONTEXT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_context (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferences JSONB DEFAULT '{}',
    learned_patterns JSONB DEFAULT '{}',
    last_interaction TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_context_user_id ON ai_context(user_id);

COMMENT ON TABLE ai_context IS 'User preferences and AI learned patterns';
COMMENT ON COLUMN ai_context.preferences IS 'User AI preferences (voice/text, greeting times, etc)';
COMMENT ON COLUMN ai_context.learned_patterns IS 'AI learned user patterns and behaviors';

-- ============================================
-- AI PENDING ACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_pending_actions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_user_status ON ai_pending_actions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_created_at ON ai_pending_actions(created_at DESC);

COMMENT ON TABLE ai_pending_actions IS 'Actions awaiting user approval (drafts, scheduled tasks, etc)';
COMMENT ON COLUMN ai_pending_actions.action_type IS 'Type of action: create_log, create_goal, send_email, etc';
COMMENT ON COLUMN ai_pending_actions.action_data IS 'Action parameters in JSON format';

-- ============================================
-- AI EXTERNAL SYNC TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_external_sync (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service VARCHAR(50) NOT NULL CHECK (service IN ('gmail', 'twitter', 'google_calendar')),
    last_sync TIMESTAMP,
    sync_token TEXT,
    credentials JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service)
);

CREATE INDEX IF NOT EXISTS idx_ai_external_sync_user_service ON ai_external_sync(user_id, service);

COMMENT ON TABLE ai_external_sync IS 'External service OAuth tokens and sync status';
COMMENT ON COLUMN ai_external_sync.service IS 'External service: gmail, twitter, google_calendar';
COMMENT ON COLUMN ai_external_sync.sync_token IS 'Last sync token for incremental updates';
COMMENT ON COLUMN ai_external_sync.credentials IS 'OAuth credentials (encrypted)';

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger for ai_context
DROP TRIGGER IF EXISTS update_ai_context_updated_at ON ai_context;
CREATE TRIGGER update_ai_context_updated_at 
BEFORE UPDATE ON ai_context
FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

-- Trigger for ai_external_sync
DROP TRIGGER IF EXISTS update_ai_external_sync_updated_at ON ai_external_sync;
CREATE TRIGGER update_ai_external_sync_updated_at 
BEFORE UPDATE ON ai_external_sync
FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%'
ORDER BY table_name;

-- Check table row counts (should be 0 initially)
SELECT 
    'ai_conversations' as table_name, COUNT(*) as row_count FROM ai_conversations
UNION ALL
SELECT 'ai_context', COUNT(*) FROM ai_context
UNION ALL
SELECT 'ai_pending_actions', COUNT(*) FROM ai_pending_actions
UNION ALL
SELECT 'ai_external_sync', COUNT(*) FROM ai_external_sync;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'Calos AI migration completed successfully!' as status;
