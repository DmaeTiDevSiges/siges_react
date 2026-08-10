# Database Structure Backup System

## Overview

This directory contains the complete database structure backup system, automatically maintained with all database objects in the correct creation order for easy restoration.

## Directory Structure

```
supabase/
├── database-structure/           # Main backup directory
│   ├── README.md                 # This file
│   ├── 00-seed-data/            # Reference data (must be loaded first)
│   │   ├── departments.sql
│   │   ├── cfg_assets_types.sql
│   │   └── ...
│   ├── 01-core-schema/          # Core tables (no FK dependencies)
│   │   ├── users.sql
│   │   ├── companies.sql
│   │   └── ...
│   ├── 02-business-schema/      # Business tables (with FKs)
│   │   ├── v_orders.sql
│   │   ├── assets.sql
│   │   └── ...
│   ├── 03-views/                # All database views
│   │   ├── v_orders_visits.sql
│   │   └── ...
│   ├── 04-functions/            # Custom functions
│   │   └── *.sql
│   ├── 05-triggers/             # All triggers
│   │   └── *.sql
│   ├── 06-policies/             # RLS policies
│   │   └── *.sql
│   ├── 07-indexes/              # Performance indexes
│   │   └── *.sql
│   └── 08-constraints/          # Additional constraints
│       └── *.sql
├── migrations/                  # Historical migrations
├── full_migration/             # Complete migration files
└── *.sql                       # Legacy/individual patches
```

## Creation Order

The folders are numbered to ensure correct creation order:

1. **00-seed-data** - Reference/configuration data (no dependencies)
2. **01-core-schema** - Base tables (users, companies, etc.)
3. **02-business-schema** - Tables with foreign keys to core tables
4. **03-views** - Views that depend on tables
5. **04-functions** - Custom PostgreSQL functions
6. **05-triggers** - Triggers that use functions
7. **06-policies** - Row Level Security policies
8. **07-indexes** - Performance optimization
9. **08-constraints** - Additional constraints

## Restoration Process

### Full Database Restore

```bash
# 1. Create fresh database
psql -h your-host -U postgres -c "CREATE DATABASE siges;"

# 2. Run all scripts in order
psql -h your-host -U postgres -d siges -f database-structure/00-seed-data/*.sql
psql -h your-host -U postgres -d siges -f database-structure/01-core-schema/*.sql
psql -h your-host -U postgres -d siges -f database-structure/02-business-schema/*.sql
psql -h your-host -U postgres -d siges -f database-structure/03-views/*.sql
psql -h your-host -U postgres -d siges -f database-structure/04-functions/*.sql
psql -h your-host -U postgres -d siges -f database-structure/05-triggers/*.sql
psql -h your-host -U postgres -d siges -f database-structure/06-policies/*.sql
psql -h your-host -U postgres -d siges -f database-structure/07-indexes/*.sql
psql -h your-host -U postgres -d siges -f database-structure/08-constraints/*.sql
```

### Automated Restore Script

```bash
# Using the restore script
node scripts/restore-database.js --host your-host --database siges --user postgres
```

## Update Process

### Automatic Updates (Recommended)

Run the export script after any database changes:

```bash
# Export current database structure
npm run db:export
```

This will:
1. Connect to your database
2. Extract all objects
3. Organize them by category
4. Number them in correct order
5. Update this directory

### Manual Updates

1. Make your schema changes
2. Run `npm run db:export` to update backups
3. Commit the changes

## Scripts

Available npm scripts in `package.json`:

```json
{
  "scripts": {
    "db:export": "node scripts/export-database-structure.js",
    "db:restore": "node scripts/restore-database.js",
    "db:backup": "node scripts/full-backup.js",
    "db:validate": "node scripts/validate-schema.js"
  }
}
```

## File Naming Convention

- Files are prefixed with numbers for ordering (e.g., `001-users.sql`)
- Names are descriptive (e.g., `015-create-v-orders-view.sql`)
- Each file is idempotent (can be run multiple times safely)

## Idempotency

All SQL files use patterns like:

```sql
-- Tables
CREATE TABLE IF NOT EXISTS users (...);

-- Views
CREATE OR REPLACE VIEW my_view AS ...;

-- Functions
CREATE OR REPLACE FUNCTION my_func() ...;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- Drop and recreate (when needed)
DROP VIEW IF EXISTS my_view CASCADE;
CREATE VIEW my_view AS ...;
```

## Dependencies Tracking

Each SQL file includes a header comment showing dependencies:

```sql
-- ============================================================================
-- File: 015-v-orders.sql
-- Dependencies: 
--   - 001-users.sql
--   - 005-companies.sql
--   - 010-order-types.sql
-- Description: Creates the v_orders view for order management
-- ============================================================================
```

## Version Control

- All structure files are committed to Git
- Migration history is preserved
- Each change should have a corresponding SQL file
- Use meaningful commit messages

## Validation

Before restoring to production:

```bash
# Validate structure integrity
npm run db:validate

# Test restore on staging first
npm run db:restore -- --host staging-host --database siges_staging
```

## Backup Schedule

- **Automatic**: Run `npm run db:export` after every schema change
- **Scheduled**: Daily export via cron job (optional)
- **Pre-deployment**: Always export before deploying

## Troubleshooting

### Foreign Key Errors

If you get FK errors during restore:
1. Check file numbering is correct
2. Verify dependencies in file headers
3. Ensure seed data loads first

### Missing Objects

If objects are missing after restore:
1. Check for CASCADE deletions
2. Verify all dependencies exist
3. Run validation script

### Permission Issues

If you get permission errors:
1. Ensure you're using correct database user
2. Check RLS policies are enabled
3. Verify service role key has sufficient privileges

## Best Practices

1. ✅ Always test restores on a non-production database
2. ✅ Keep migration history (don't delete old files)
3. ✅ Use transactions in migration files
4. ✅ Include rollback instructions when possible
5. ✅ Document complex changes in comments
6. ✅ Test with `db:validate` before committing

## Monitoring

Check backup status:

```bash
# Last export timestamp
cat supabase/database-structure/.last-export

# Validate current structure
npm run db:validate
```

## Related Documentation

- [MCP Supabase Setup](../MCP_SUPABASE_SETUP.md)
- [Quick Start Guide](../README_MCP_QUICKSTART.md)
- [Deployment Guide](../HOW_TO_BUILD_APK.md)

---

**Last Updated**: Automatically generated
**Database Version**: Check `.last-export` file
**Maintained By**: Automated export system
