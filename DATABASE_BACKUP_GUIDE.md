# Database Structure Backup & Restore Guide

## Overview

This guide explains how to use the automated database structure backup system that maintains all database objects (tables, views, functions, triggers, etc.) in the correct creation order for easy restoration.

## Directory Structure

```
supabase/
├── database-structure/          # Auto-generated backup directory
│   ├── README.md                # Internal documentation
│   ├── 00-seed-data/           # Reference data (loaded first)
│   ├── 01-core-schema/         # Core tables (no FK dependencies)
│   ├── 02-business-schema/     # Business tables (with FKs)
│   ├── 03-views/               # All database views
│   ├── 04-functions/           # Custom PostgreSQL functions
│   ├── 05-triggers/            # All triggers
│   ├── 06-policies/            # RLS policies
│   ├── 07-indexes/             # Performance indexes
│   ├── 08-constraints/         # Additional constraints
│   └── .export-metadata.json   # Export metadata
└── *.sql                       # Legacy SQL files
```

## Creation Order

Files are organized by dependency level to ensure safe restoration:

1. **00-seed-data** - Reference/configuration tables (no dependencies)
2. **01-core-schema** - Base tables like users, companies
3. **02-business-schema** - Tables with foreign keys to core tables
4. **03-views** - Views that depend on tables
5. **04-functions** - Custom PostgreSQL functions
6. **05-triggers** - Triggers (may use functions)
7. **06-policies** - Row Level Security policies
8. **07-indexes** - Performance indexes
9. **08-constraints** - Additional constraints

This order prevents foreign key and dependency errors during restoration.

---

## Quick Start

### Export Current Database Structure

```bash
# Connect to your database and export everything
npm run db:export
```

This will:
- Connect to your Supabase database
- Extract all tables, views, functions, triggers, policies, etc.
- Organize them into numbered directories
- Create idempotent SQL files (safe to run multiple times)
- Generate metadata file with timestamp

### Validate Before Restore

```bash
# Check for common issues
npm run db:validate
```

This will:
- Verify file naming conventions
- Check for duplicate table creations
- Look for syntax errors
- Ensure idempotency patterns
- Report warnings and issues

### Restore to Database

```bash
# Interactive restore (asks for confirmation)
npm run db:restore

# Non-interactive (skip confirmation)
npm run db:restore -- --yes

# Dry run (test without making changes)
npm run db:restore -- --dry-run

# Restore to specific database
npm run db:restore -- --host your-host --database siges --user postgres

# Stop on first error
npm run db:restore -- --stop-on-error
```

---

## Detailed Usage

### Export Command

```bash
npm run db:export
```

**What it does:**
1. Connects to database using environment variables
2. Creates `supabase/database-structure/` directory structure
3. Exports each category to separate folders
4. Numbers files for correct execution order
5. Adds DROP IF EXISTS / CREATE IF NOT EXISTS statements
6. Generates `.export-metadata.json` with timestamp

**Environment Variables Used:**
```bash
VITE_SUPABASE_DB_HOST=supabase_db      # Docker service name
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=postgres
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=your_password
```

**Output Example:**
```
╔═══════════════════════════════════════════════╗
║   Database Structure Export                   ║
╚═══════════════════════════════════════════════╝

📡 Connecting to database...
✅ Connected successfully

📁 Creating directory structure...
✅ Directories created

🔄 Starting export process...

📦 Exporting seed data (reference tables)...
   ✅ cfg_users_statuses (3 rows)
   ✅ cfg_contracts_statuses (4 rows)
   ✅ cfg_assets_types (5 rows)

🏗️  Exporting core schema (no FK dependencies)...
   ✅ users
   ✅ companies
   ✅ departments

💼 Exporting business schema (with FKs)...
   ✅ v_orders
   ✅ assets
   ✅ orders_visits

👁️  Exporting views...
   ✅ v_orders_visits
   ✅ v_assets_summary

⚙️  Exporting functions...
   ✅ update_updated_at_column

🎯 Exporting triggers...
   ✅ trigger_update_updated_at

🔒 Exporting RLS policies...
   ✅ enable_rls on users

📊 Exporting indexes...
   ✅ idx_users_email on users

🔗 Exporting additional constraints...
   ✅ check_valid_email on users

✅ Export completed successfully!

📂 Output directory: supabase/database-structure
📄 Files created: 47
```

---

### Validate Command

```bash
npm run db:validate
```

**What it checks:**
- File naming conventions (should start with 001-, 002-, etc.)
- Header comments presence
- Idempotency patterns (DROP IF EXISTS, CREATE IF NOT EXISTS)
- Semicolons at end of files
- Common SQL typos
- Unclosed quotes
- Duplicate table creations
- Export age (warns if > 7 days old)

**Validation Report:**
```
╔═══════════════════════════════════════════════╗
║   Database Schema Validation                  ║
╚═══════════════════════════════════════════════╝

📁 Validating directory structure...

📂 Checking 00-seed-data...
   Found 5 file(s)

📂 Checking 01-core-schema...
   Found 8 file(s)

...

🔍 Checking for common issues...

════════════════════════════════════════════════
VALIDATION RESULTS
════════════════════════════════════════════════

⚠️  2 warning(s):

   1. 015-users.sql: Large file (52.3KB) - consider splitting
   2. Database export is 10 days old - consider re-exporting

✅ Validation passed with warnings only.

You can proceed with restore, but review warnings above.
```

---

### Restore Command

```bash
# Basic restore
npm run db:restore

# Restore with custom connection
npm run db:restore -- --host my-host --database siges_prod --user postgres

# Dry run first (recommended!)
npm run db:restore -- --dry-run

# Skip confirmation prompt
npm run db:restore -- --yes

# Stop on first error (default is to continue)
npm run db:restore -- --stop-on-error
```

**Restore Process:**
1. Reads all SQL files from `supabase/database-structure/`
2. Executes directories in numbered order (00 → 08)
3. Executes files within each directory in alphabetical order
4. Reports success/failure for each file
5. Continues on error (unless `--stop-on-error` flag)

**Example Output:**
```
╔═══════════════════════════════════════════════╗
║   Database Structure Restore                  ║
╚═══════════════════════════════════════════════╝

Configuration:
  Host: localhost
  Port: 5432
  Database: siges
  User: postgres
  Dry Run: No

⚠️  WARNING: This will modify your database structure!
⚠️  Make sure you have a recent backup before proceeding.

Do you want to continue? (yes/no): yes

📡 Connecting to database...
✅ Connected successfully

📂 Processing 00-seed-data...
   Found 5 file(s)
   ✅ Executed: 001-cfg_users_statuses.sql
   ✅ Executed: 002-cfg_contracts_statuses.sql
   ...

📂 Processing 01-core-schema...
   Found 8 file(s)
   ✅ Executed: 001-create-users-table.sql
   ✅ Executed: 002-create-companies-table.sql
   ...

📂 Processing 02-business-schema...
   ...

✅ Database restore completed successfully!

Next steps:
1. Verify the restored structure
2. Test your application
3. Update documentation if needed
```

---

## Use Cases

### Scenario 1: Setting Up Development Environment

```bash
# 1. Clone repository
git clone <your-repo>
cd siges_react

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Validate exported structure
npm run db:validate

# 5. Restore to local database
npm run db:restore -- --host localhost --database siges_dev

# 6. Seed initial data (if separate)
psql -h localhost -U postgres -d siges_dev -f supabase/data/*.sql
```

---

### Scenario 2: Deploying Schema Changes to Production

```bash
# 1. Make schema changes in development
# (using SQL editor, migration tool, etc.)

# 2. Export updated structure
npm run db:export

# 3. Review changes
git diff supabase/database-structure/

# 4. Commit changes
git add supabase/database-structure/
git commit -m "Update schema: added new column to users table"

# 5. Push to staging first
npm run db:restore -- --host staging-host --database siges_staging

# 6. Test thoroughly on staging

# 7. Deploy to production
npm run db:restore -- --host prod-host --database siges_prod --yes

# 8. Verify production
# Run application tests, check logs, etc.
```

---

### Scenario 3: Disaster Recovery

```bash
# Database crashed? Need to restore everything?

# 1. Create fresh database
createdb -h your-host -U postgres siges_new

# 2. Restore complete structure
npm run db:restore -- --host your-host --database siges_new --yes

# 3. Restore data from backup
# (assuming you have data backup separately)
psql -h your-host -U postgres -d siges_new -f backup_data.sql

# 4. Verify
npm run db:validate -- --host your-host --database siges_new
```

---

### Scenario 4: Creating Migration Scripts

```bash
# Instead of writing manual migrations:

# 1. Make changes in development database
# 2. Export structure
npm run db:export

# 3. Compare with previous version
git diff supabase/database-structure/

# 4. Extract relevant changes to migration file
# The numbered files make it easy to see what changed where
```

---

## Best Practices

### ✅ DO:

1. **Export after every schema change**
   ```bash
   # Make it a habit
   ALTER TABLE users ADD COLUMN new_col TEXT;
   npm run db:export  # Do this immediately!
   ```

2. **Validate before restoring**
   ```bash
   npm run db:validate  # Always run this first
   npm run db:restore   # Then restore
   ```

3. **Test on staging first**
   ```bash
   # Always test restores on non-production databases
   npm run db:restore -- --host staging --database siges_staging
   ```

4. **Use dry-run mode**
   ```bash
   # See what would happen without making changes
   npm run db:restore -- --dry-run
   ```

5. **Keep export history**
   ```bash
   # Don't delete old exports - they're your migration history
   git add supabase/database-structure/
   git commit -m "Schema export 2026-03-05"
   ```

6. **Review generated files**
   ```bash
   # Occasionally check what's being generated
   cat supabase/database-structure/01-core-schema/001-create-users-table.sql
   ```

### ❌ DON'T:

1. **Don't manually edit exported files**
   - They're auto-generated
   - Changes will be overwritten on next export
   - Make changes in database, then re-export

2. **Don't restore to production without testing**
   - Always test on staging/dev first
   - Verify with application tests
   - Have rollback plan ready

3. **Don't ignore validation warnings**
   - They indicate potential problems
   - Fix issues before restoring
   - Re-export if needed

4. **Don't skip backups**
   - Export is not a backup replacement
   - Still need regular full database backups
   - Use point-in-time recovery when available

---

## Troubleshooting

### Issue: Export fails with connection error

**Solution:**
```bash
# Check environment variables
echo $VITE_SUPABASE_DB_HOST
echo $VITE_SUPABASE_DB_PASSWORD

# Test connection manually
psql -h your-host -U postgres -d postgres -c "SELECT 1"

# For Docker/self-hosted
docker ps | grep supabase_db
docker network inspect supabase_network
```

---

### Issue: Restore fails with foreign key error

**Cause:** Tables being created in wrong order

**Solution:**
1. Check file numbering is correct
2. Verify directory structure matches execution order
3. Manually adjust file numbers if needed:
   ```bash
   # Rename to fix order
   mv 010-create-orders.sql 005-create-orders.sql
   ```

---

### Issue: Validation reports duplicate table creation

**Cause:** Same table created in multiple files

**Solution:**
1. Find duplicates:
   ```bash
   grep -r "CREATE TABLE" supabase/database-structure/
   ```
2. Remove or merge duplicate files
3. Re-export from database

---

### Issue: Missing objects after restore

**Cause:** Objects not exported or export failed silently

**Solution:**
1. Check export logs for errors
2. Verify objects exist in source database
3. Manually export if needed:
   ```bash
   # Get view definition
   psql -c "\d+ your_view"
   
   # Get function definition
   psql -c "SELECT pg_get_functiondef('your_func'::regproc)"
   ```

---

## Advanced Topics

### Custom Export Configuration

Create `scripts/export-config.js`:

```javascript
module.exports = {
  // Customize which tables to include/exclude
  includeTables: ['users', 'companies', 'orders'],
  excludeTables: ['pg_stat%', 'temp_%'],
  
  // Customize output format
  addComments: true,
  addDropStatements: true,
  idempotent: true,
  
  // Add custom headers
  headerTemplate: `-- Generated by SIGES DB Export
-- Database: <%= database %>
-- Generated: <%= date %>
-- Environment: <%= environment %>
`
};
```

### Incremental Exports

For large databases, export incrementally:

```bash
# Export only changed objects
npm run db:export -- --incremental

# Export specific schema
npm run db:export -- --schema public

# Export specific tables
npm run db:export -- --tables users,companies,orders
```

### Pre/Post Export Hooks

Create `scripts/hooks.js`:

```javascript
module.exports = {
  preExport: async (client) => {
    console.log('Running pre-export tasks...');
    await client.query('SET statement_timeout TO 30000');
  },
  
  postExport: async () => {
    console.log('Running post-export tasks...');
    // Send notification, update docs, etc.
  }
};
```

---

## File Format Examples

### Seed Data File (00-seed-data/001-cfg_users_statuses.sql)

```sql
-- =============================================================================
-- Seed Data: cfg_users_statuses
-- Description: Reference/configuration data for cfg_users_statuses
-- Records: 3
-- =============================================================================

INSERT INTO public.cfg_users_statuses (id, code, description)
VALUES
    (1, 'ANA', 'Analise'),
    (2, 'ATI', 'Ativo'),
    (3, 'INA', 'Inativo')
ON CONFLICT (id) DO NOTHING;
```

### Table File (01-core-schema/001-create-users-table.sql)

```sql
-- =============================================================================
-- Table: users
-- Description: Users table with no FK dependencies
-- =============================================================================

DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE IF NOT EXISTS public.users (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    email character varying NOT NULL,
    name character varying,
    created_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.users IS 'System users';
COMMENT ON COLUMN public.users.email IS 'User email address';
```

### View File (03-views/001-create-v-orders-visits-view.sql)

```sql
-- =============================================================================
-- View: v_orders_visits
-- Description: Combined orders and visits view
-- =============================================================================

DROP VIEW IF EXISTS public.v_orders_visits CASCADE;

CREATE OR REPLACE VIEW public.v_orders_visits AS
SELECT 
    o.id as order_id,
    o.status,
    v.id as visit_id,
    v.visit_date
FROM public.orders o
LEFT JOIN public.visits v ON v.order_id = o.id;
```

---

## Related Documentation

- [MCP Supabase Setup](../MCP_SUPABASE_SETUP.md)
- [Quick Start Guide](../README_MCP_QUICKSTART.md)
- [Deployment Guide](../HOW_TO_BUILD_APK.md)

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review export logs
3. Validate schema first: `npm run db:validate`
4. Test on non-production database

---

**Last Updated**: 2026-03-05  
**Version**: 1.0.0  
**Maintained By**: Automated export system
