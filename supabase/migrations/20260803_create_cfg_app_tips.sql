-- ============================================================
-- Migration: Create cfg_app_tips and cfg_app_tips_dismissals
-- Date: 2026-08-03
-- ============================================================

-- Table: cfg_app_tips
CREATE TABLE IF NOT EXISTS cfg_app_tips (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    body          TEXT NOT NULL,
    icon          TEXT NOT NULL DEFAULT 'lightbulb',
    screen_target TEXT NOT NULL DEFAULT '*',
    priority      INTEGER NOT NULL DEFAULT 0,
    start_date    TIMESTAMP,
    end_date      TIMESTAMP,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_by    INTEGER REFERENCES users(id),
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Table: cfg_app_tips_dismissals
CREATE TABLE IF NOT EXISTS cfg_app_tips_dismissals (
    id            SERIAL PRIMARY KEY,
    tip_id        INTEGER NOT NULL REFERENCES cfg_app_tips(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    dismissed_at  TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(tip_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_screen_target ON cfg_app_tips(screen_target);
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_is_active ON cfg_app_tips(is_active);
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_dismissals_tip_id ON cfg_app_tips_dismissals(tip_id);
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_dismissals_user_id ON cfg_app_tips_dismissals(user_id);

-- RLS: cfg_app_tips
ALTER TABLE cfg_app_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tips"
    ON cfg_app_tips FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage tips"
    ON cfg_app_tips FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );

-- RLS: cfg_app_tips_dismissals
ALTER TABLE cfg_app_tips_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
    ON cfg_app_tips_dismissals FOR SELECT
    USING (
        user_id = (
            SELECT id FROM users WHERE uuid = auth.uid()
        )
    );

CREATE POLICY "Users can insert own dismissals"
    ON cfg_app_tips_dismissals FOR INSERT
    WITH CHECK (
        user_id = (
            SELECT id FROM users WHERE uuid = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all dismissals"
    ON cfg_app_tips_dismissals FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_cfg_app_tips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cfg_app_tips_updated_at
    BEFORE UPDATE ON cfg_app_tips
    FOR EACH ROW
    EXECUTE FUNCTION update_cfg_app_tips_updated_at();
