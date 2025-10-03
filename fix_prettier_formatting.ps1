# ============================================================
# PowerShell Script: Fix Prettier/ESLint Formatting Issues
# ============================================================

Write-Host "Fixing Prettier/ESLint formatting issues..." -ForegroundColor Green
Write-Host ""

# Run ESLint with auto-fix
Write-Host "Running ESLint auto-fix..." -ForegroundColor Cyan
npm run lint -- --fix

Write-Host ""
Write-Host "Running Prettier format..." -ForegroundColor Cyan
npm run format

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host "Formatting Complete!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "All Prettier/ESLint issues should now be fixed." -ForegroundColor Green
Write-Host ""
Write-Host "Try building now:" -ForegroundColor Cyan
Write-Host "  npm run build" -ForegroundColor White
Write-Host ""