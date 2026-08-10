-- Migration to add 'object' column to 'contracts' table
ALTER TABLE contracts ADD COLUMN object VARCHAR(255);

-- Register migration status if needed
-- INSERT INTO supabase_migration_status (name) VALUES ('add_object_to_contracts');
