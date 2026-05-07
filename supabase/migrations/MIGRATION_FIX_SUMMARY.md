# Migration Fix Summary

## Problem Solved

When running the PostgreSQL migration (`schema_public.sql`), the following errors occurred:

1. **ERROR: 42P01: relation "v_orders_visits_assets_materials" does not exist**
   - Functions were referencing views before they were created
   
2. **ERROR: 42723: function "fc_team_descendants" already exists with same argument types**
   - Functions were being created without DROP statements, causing conflicts on re-run

## Fixes Applied

### 1. Fixed View Dependencies (Lines ~1574-1649 → 5682-5755)

Moved three SQL functions to after their dependent views are created:

- `fc_financial_orders_visits_materials_sum` - now at line 5682 (after view at 5567)
- `fc_financial_orders_visits_services_sum` - now at line 5710 (after view at 5590)  
- `fc_financial_orders_visits_vehicles_sum` - now at line 5738 (after view at 5659)

**Views creation order:**
```sql
Line 5567: CREATE VIEW v_orders_visits_assets_materials
Line 5590: CREATE VIEW v_orders_visits_services
Line 5659: CREATE VIEW v_orders_visits_vehicles
Line 5682: CREATE FUNCTION fc_financial_orders_visits_materials_sum  ✓
Line 5710: CREATE FUNCTION fc_financial_orders_visits_services_sum  ✓
Line 5738: CREATE FUNCTION fc_financial_orders_visits_vehicles_sum  ✓
```

### 2. Added DROP Statements for All Functions

Added `DROP FUNCTION IF EXISTS` before all **44 function definitions** in the schema. This allows the migration to run on databases that may already have these functions.

**Total Functions:** 44 CREATE FUNCTION = 44 DROP FUNCTION IF EXISTS ✓

**Example:**
```sql
-- Before:
CREATE FUNCTION public.fc_team_descendants(team_id bigint) ...

-- After:
DROP FUNCTION IF EXISTS public.fc_team_descendants(bigint);
CREATE FUNCTION public.fc_team_descendants(team_id bigint) ...
```

**Functions Fixed:**
- fc_assets_search_filters (fixed malformed syntax with backticks)
- fc_assets_searchable_update (trigger function)
- fc_cfg_units_assets_tags_set_last_values_when_processing_2 (trigger)
- fc_materials_searchable (trigger)
- fc_orders_visits_* functions (multiple)
- fc_tgr_units_searchable (trigger)
- handle_new_user (trigger)
- handle_notifications_count (trigger)
- handle_profile_photo_change_notification (trigger)
- And 34 more functions

## Files Modified

1. **schema_public.sql** - Main migration file with all fixes applied
2. **drop_all_functions_views.sql** - Helper script to clean database before migration (optional)
3. **add-drop-statements.ps1** - PowerShell script used to add DROP statements automatically

## How to Use

### Option 1: Clean Database (Recommended for Development)

```bash
# Run the cleanup script first
psql -U your_user -d your_database -f drop_all_functions_views.sql

# Then run the migration
psql -U your_user -d your_database -f schema_public.sql
```

### Option 2: Direct Migration (Production-Safe)

The `schema_public.sql` file now includes DROP statements before each function, so it can be run directly:

```bash
psql -U your_user -d your_database -f schema_public.sql
```

The DROP statements ensure functions are recreated cleanly without conflicts.

## Verification Commands

Check if all dependencies are resolved:
```bash
# Count DROP statements (should be 24+)
grep "^DROP FUNCTION IF EXISTS" schema_public.sql | wc -l

# Verify specific function has DROP
grep -A 2 "fc_team_descendants" schema_public.sql
```

## Notes

- Tables and views maintain proper creation order based on dependencies
- Foreign keys and constraints are created after their referenced tables
- Triggers are created after their required functions and tables
- The migration is now idempotent for functions (can be run multiple times safely)

## Next Steps

If you encounter any other "already exists" errors for tables or views, consider:
1. Running on a clean database
2. Adding similar DROP statements for views/tables
3. Using `CREATE OR REPLACE` instead of `CREATE` for views
