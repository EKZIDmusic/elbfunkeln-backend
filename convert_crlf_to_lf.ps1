# ============================================================
# PowerShell Script: Convert CRLF to LF Line Endings
# ============================================================

Write-Host "Starting CRLF to LF conversion..." -ForegroundColor Green
Write-Host ""

# Base directory
$baseDir = "src"

# Define all module directories to convert
$moduleDirs = @(
    "shipping",
    "returns",
    "kpis",
    "dashboard",
    "social",
    "accounting",
    "legal",
    "cookies",
    "search",
    "tax",
    "integrations"
)

$totalFiles = 0
$convertedFiles = 0

# Function to convert CRLF to LF
function Convert-CRLFtoLF {
    param(
        [string]$FilePath
    )
    
    try {
        # Read file content as bytes
        $content = Get-Content -Path $FilePath -Raw
        
        # Check if file contains CRLF
        if ($content -match "`r`n") {
            # Replace CRLF with LF
            $content = $content -replace "`r`n", "`n"
            
            # Write back to file with UTF8 encoding without BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
            
            Write-Host "  ✓ Converted: $FilePath" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  - Already LF: $FilePath" -ForegroundColor Gray
            return $false
        }
    }
    catch {
        Write-Host "  ✗ Error converting: $FilePath - $_" -ForegroundColor Red
        return $false
    }
}

# Process each module directory
foreach ($moduleDir in $moduleDirs) {
    $fullPath = Join-Path $baseDir $moduleDir
    
    if (Test-Path $fullPath) {
        Write-Host "Processing module: $moduleDir" -ForegroundColor Cyan
        
        # Get all .ts files recursively
        $files = Get-ChildItem -Path $fullPath -Filter "*.ts" -Recurse -File
        
        foreach ($file in $files) {
            $totalFiles++
            $wasConverted = Convert-CRLFtoLF -FilePath $file.FullName
            if ($wasConverted) {
                $convertedFiles++
            }
        }
        
        Write-Host ""
    } else {
        Write-Host "Warning: Directory not found - $fullPath" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "CONVERSION SUMMARY:" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "Total files processed: $totalFiles" -ForegroundColor White
Write-Host "Files converted: $convertedFiles" -ForegroundColor Green
Write-Host "Files already LF: $($totalFiles - $convertedFiles)" -ForegroundColor Gray
Write-Host ""
Write-Host "All files now use LF line endings!" -ForegroundColor Green
Write-Host ""