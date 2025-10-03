# ============================================================
# PowerShell Script: Fix ALL tsconfig files in project
# ============================================================

Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host "Fixing ALL tsconfig*.json files in project..." -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host ""

$fixedCount = 0
$errorCount = 0

# Find all tsconfig*.json files
$tsconfigFiles = Get-ChildItem -Path "." -Filter "tsconfig*.json" -Recurse -File | Where-Object {
    $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "dist"
}

Write-Host "Found $($tsconfigFiles.Count) tsconfig files:" -ForegroundColor Cyan
foreach ($file in $tsconfigFiles) {
    Write-Host "  - $($file.FullName)" -ForegroundColor Gray
}
Write-Host ""

foreach ($file in $tsconfigFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
    
    try {
        # Read file content
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Fix common issues
        $changes = @()
        
        # Fix: "nodenext" -> "NodeNext" (with quotes)
        if ($content -match '"nodenext"') {
            $content = $content -replace '"nodenext"', '"NodeNext"'
            $changes += "  ✓ Fixed: 'nodenext' → 'NodeNext'"
        }
        
        # Fix: "ES2023" -> "ES2022" (with quotes)
        if ($content -match '"ES2023"') {
            $content = $content -replace '"ES2023"', '"ES2022"'
            $changes += "  ✓ Fixed: 'ES2023' → 'ES2022'"
        }
        
        # Fix: "esnext" -> "ESNext" (with quotes)
        if ($content -match '"esnext"') {
            $content = $content -replace '"esnext"', '"ESNext"'
            $changes += "  ✓ Fixed: 'esnext' → 'ESNext'"
        }
        
        # Fix: "commonjs" -> "CommonJS" (with quotes)
        if ($content -match '"commonjs"') {
            $content = $content -replace '"commonjs"', '"CommonJS"'
            $changes += "  ✓ Fixed: 'commonjs' → 'CommonJS'"
        }
        
        # Check if any changes were made
        if ($content -ne $originalContent) {
            # Convert to LF line endings
            $content = $content -replace "`r`n", "`n"
            
            # Write back to file with UTF-8 without BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
            
            Write-Host "  ✅ FIXED: $($file.Name)" -ForegroundColor Green
            foreach ($change in $changes) {
                Write-Host $change -ForegroundColor White
            }
            $fixedCount++
        } else {
            Write-Host "  ⚪ OK: No changes needed" -ForegroundColor Gray
        }
        
        Write-Host ""
    }
    catch {
        Write-Host "  ❌ ERROR: Failed to process $($file.Name)" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        $errorCount++
        Write-Host ""
    }
}

# Summary
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host "SUMMARY" -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host "Total files found: $($tsconfigFiles.Count)" -ForegroundColor White
Write-Host "Files fixed: $fixedCount" -ForegroundColor Green
Write-Host "Files unchanged: $($tsconfigFiles.Count - $fixedCount - $errorCount)" -ForegroundColor Gray
if ($errorCount -gt 0) {
    Write-Host "Errors: $errorCount" -ForegroundColor Red
}
Write-Host ""

if ($fixedCount -gt 0) {
    Write-Host "✅ Changes applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Reload VS Code window: Ctrl+Shift+P -> 'Developer: Reload Window'" -ForegroundColor White
    Write-Host "2. Run: npm run build" -ForegroundColor White
} else {
    Write-Host "ℹ️  No changes needed - all files are already correct!" -ForegroundColor Cyan
}
Write-Host ""

# Optional: Show what the errors were looking for
Write-Host "Common fixes applied:" -ForegroundColor Yellow
Write-Host "  • 'nodenext' → 'NodeNext' (case-sensitive)" -ForegroundColor White
Write-Host "  • 'ES2023' → 'ES2022' (ES2023 not supported)" -ForegroundColor White
Write-Host "  • 'esnext' → 'ESNext' (case-sensitive)" -ForegroundColor White
Write-Host "  • 'commonjs' → 'CommonJS' (case-sensitive)" -ForegroundColor White
Write-Host ""