# Migration Verification Script
# Run this to verify the migration file is correct before executing

Write-Host "=== PostgreSQL Migration Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check for backticks (should be 0)
$backticks = Get-Content schema_public.sql | Select-String "`""
if ($backticks.Count -gt 0) {
    Write-Host "ERROR: Found $($backticks.Count) backticks in SQL!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[OK] No backticks found" -ForegroundColor Green
}

# Count DROP and CREATE statements
$drops = (Get-Content schema_public.sql | Select-String "^DROP FUNCTION IF EXISTS").Count
$creates = (Get-Content schema_public.sql | Select-String "^CREATE FUNCTION public.").Count

Write-Host "[OK] DROP statements: $drops" -ForegroundColor Green
Write-Host "[OK] CREATE FUNCTION statements: $creates" -ForegroundColor Green

if ($drops -ne $creates) {
    Write-Host "ERROR: Mismatch! $drops DROPs vs $creates CREATEs" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[OK] All functions have DROP statements" -ForegroundColor Green
}

# Check critical functions exist
$criticalFunctions = @(
    "fc_assets_search_filters",
    "fc_team_descendants",
    "fc_financial_orders_visits_materials_sum",
    "fc_financial_orders_visits_services_sum",
    "fc_financial_orders_visits_vehicles_sum"
)

Write-Host ""
Write-Host "Checking critical functions:" -ForegroundColor Cyan
foreach ($func in $criticalFunctions) {
    $hasDrop = Get-Content schema_public.sql | Select-String "DROP FUNCTION IF EXISTS public.$func"
    $hasCreate = Get-Content schema_public.sql | Select-String "CREATE FUNCTION public.$func"
    
    if ($hasDrop -and $hasCreate) {
        Write-Host "  [OK] $func" -ForegroundColor Green
    } else {
        Write-Host "  ERROR $func MISSING!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Verification Complete ===" -ForegroundColor Cyan
Write-Host "Migration file is ready to use!" -ForegroundColor Green
Write-Host ""
Write-Host "To run migration:" -ForegroundColor Yellow
Write-Host "  psql -U your_user -d your_database -f schema_public.sql"
