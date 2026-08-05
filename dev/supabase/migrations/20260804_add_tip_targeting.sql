-- ============================================================
-- Migration: Add user targeting to cfg_app_tips
-- Date: 2026-08-04
-- ============================================================

-- 1. Add target_mode column to cfg_app_tips
ALTER TABLE cfg_app_tips
    ADD COLUMN IF NOT EXISTS target_mode TEXT NOT NULL DEFAULT 'all';

COMMENT ON COLUMN cfg_app_tips.target_mode IS 'all = all users, filtered = targeted to specific companies/departments/profiles';

-- 2. Create junction table: cfg_app_tips_companies
CREATE TABLE IF NOT EXISTS cfg_app_tips_companies (
    id            SERIAL PRIMARY KEY,
    tip_id        INTEGER NOT NULL REFERENCES cfg_app_tips(id) ON DELETE CASCADE,
    company_id    BIGINT NOT NULL REFERENCES cfg_companies(id) ON DELETE CASCADE,
    UNIQUE(tip_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_companies_tip_id ON cfg_app_tips_companies(tip_id);
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_companies_company_id ON cfg_app_tips_companies(company_id);

-- 3. Create junction table: cfg_app_tips_departments
CREATE TABLE IF NOT EXISTS cfg_app_tips_departments (
    id              SERIAL PRIMARY KEY,
    tip_id          INTEGER NOT NULL REFERENCES cfg_app_tips(id) ON DELETE CASCADE,
    department_id   BIGINT NOT NULL REFERENCES cfg_departments(id) ON DELETE CASCADE,
    UNIQUE(tip_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_departments_tip_id ON cfg_app_tips_departments(tip_id);
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_departments_department_id ON cfg_app_tips_departments(department_id);

-- 4. Create junction table: cfg_app_tips_profiles
CREATE TABLE IF NOT EXISTS cfg_app_tips_profiles (
    id            SERIAL PRIMARY KEY,
    tip_id        INTEGER NOT NULL REFERENCES cfg_app_tips(id) ON DELETE CASCADE,
    profile_id    BIGINT NOT NULL REFERENCES cfg_profiles(id) ON DELETE CASCADE,
    UNIQUE(tip_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_profiles_tip_id ON cfg_app_tips_profiles(tip_id);
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_profiles_profile_id ON cfg_app_tips_profiles(profile_id);

-- 5. RLS for junction tables
ALTER TABLE cfg_app_tips_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_app_tips_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_app_tips_profiles ENABLE ROW LEVEL SECURITY;

-- Junction tables: anyone can read, admins can manage
CREATE POLICY "Anyone can view tip companies"
    ON cfg_app_tips_companies FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage tip companies"
    ON cfg_app_tips_companies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );

CREATE POLICY "Anyone can view tip departments"
    ON cfg_app_tips_departments FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage tip departments"
    ON cfg_app_tips_departments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );

CREATE POLICY "Anyone can view tip profiles"
    ON cfg_app_tips_profiles FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage tip profiles"
    ON cfg_app_tips_profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );
