-- Migration: Add is_divergent to assets_loans_checklists
-- Date: 2026-09-16
-- Flags checklist items that differ between before and after phases

ALTER TABLE assets_loans_checklists
    ADD COLUMN IF NOT EXISTS is_divergent BOOLEAN DEFAULT FALSE;