# Script to add DROP FUNCTION IF EXISTS before each CREATE FUNCTION in schema_public.sql

$inputFile = "schema_public.sql"
$outputFile = "schema_public_with_drops.sql"
$tempFile = "schema_public_temp.sql"

$content = Get-Content -Path $inputFile -Raw

# Pattern to match CREATE FUNCTION statements and extract function name with arguments
$pattern = '(--\s*Name:\s*(?<name>[^\s]+)\s*\([^)]+\);\s*Type:\s*FUNCTION[^\n]*\n--)'

$matches = [regex]::Matches($content, $pattern)

Write-Host "Found $($matches.Count) function declarations"

foreach ($match in $matches) {
    $functionName = $match.Groups['name'].Value.Trim()
    $position = $match.Index + $match.Length
    
    # Find the CREATE FUNCTION statement after this comment
    $createPattern = "CREATE FUNCTION public\.$functionName"
    $createMatch = [regex]::Match($content.Substring($position), $createPattern)
    
    if ($createMatch.Success) {
        $dropStatement = "DROP FUNCTION IF EXISTS public.$functionName;`n`n"
        
        # Insert DROP statement before CREATE FUNCTION
        $insertPosition = $position + $createMatch.Index
        $content = $content.Insert($insertPosition, $dropStatement)
        
        Write-Host "Added DROP for: $functionName"
    }
}

# Save modified content
$content | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "`nCompleted! Output saved to: $outputFile"
Write-Host "You can now use this file for migration."
