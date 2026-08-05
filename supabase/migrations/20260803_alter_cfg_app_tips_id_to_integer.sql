-- Migration: cfg_app_tips e cfg_app_tips_dismissals: UUID → INTEGER
-- Rode apenas se as tabelas já existirem com UUID

-- 1. Dropar dismissals (depende de cfg_app_tips.id via FK)
DROP TABLE IF EXISTS cfg_app_tips_dismissals;

-- 2. Alterar cfg_app_tips: UUID → SERIAL
ALTER TABLE cfg_app_tips DROP CONSTRAINT IF EXISTS cfg_app_tips_pkey;
ALTER TABLE cfg_app_tips ADD COLUMN new_id SERIAL;
UPDATE cfg_app_tips SET new_id = DEFAULT;
ALTER TABLE cfg_app_tips DROP COLUMN id;
ALTER TABLE cfg_app_tips RENAME COLUMN new_id TO id;
ALTER TABLE cfg_app_tips ADD PRIMARY KEY (id);
ALTER TABLE cfg_app_tips ALTER COLUMN id SET DEFAULT nextval('cfg_app_tips_id_seq');

-- 3. Recriar dismissals com tip_id INTEGER
CREATE TABLE cfg_app_tips_dismissals (
    id            SERIAL PRIMARY KEY,
    tip_id        INTEGER NOT NULL REFERENCES cfg_app_tips(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    dismissed_at  TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(tip_id, user_id)
);

-- 4. Recriar índices
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_screen_target ON cfg_app_tips(screen_target);
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_is_active ON cfg_app_tips(is_active);
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_dismissals_tip_id ON cfg_app_tips_dismissals(tip_id);
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_dismissals_user_id ON cfg_app_tips_dismissals(user_id);
