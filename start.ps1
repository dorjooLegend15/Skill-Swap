# SkillSwap AI - Backend + Frontend startup script
# PowerShell: .\start.ps1

$rootDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $rootDir) { $rootDir = (Get-Location).Path }

$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

Write-Host ""
Write-Host "  SkillSwap AI - Starting services..." -ForegroundColor Green
Write-Host ""

# Start Backend server (background job)
$backendJob = Start-Job -ArgumentList $backendDir -ScriptBlock {
    param($dir)
    Set-Location $dir
    $python = Join-Path $dir "venv\Scripts\python.exe"
    if (-not (Test-Path $python)) {
        $python = "python"
    }
    & $python -m uvicorn app.main:app --reload --port 8000 2>&1
}

Write-Host "  [1/2] Backend server is running (port 8000)..." -ForegroundColor Cyan

# Brief pause
Start-Sleep -Seconds 3

# Start Frontend dev server (background job)
$frontendJob = Start-Job -ArgumentList $frontendDir -ScriptBlock {
    param($dir)
    Set-Location $dir
    & npm.cmd run dev 2>&1
}

Write-Host "  [2/2] Frontend server is running (port 5173)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  ============================================" -ForegroundColor DarkGray
Write-Host "  Web App:   http://localhost:5173" -ForegroundColor Yellow
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "  ============================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To stop: Press Ctrl+C and type 'Y'" -ForegroundColor DarkGray
Write-Host ""

# Monitor running servers and stream logs
try {
    while ($true) {
        # Stream backend logs
        $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        if ($backendOutput) { $backendOutput | ForEach-Object { Write-Host "  [Backend] $_" -ForegroundColor DarkCyan } }

        # Stream frontend logs
        $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        if ($frontendOutput) { $frontendOutput | ForEach-Object { Write-Host "  [Frontend] $_" -ForegroundColor DarkGreen } }

        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host ""
    Write-Host "  Stopping all servers..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "  All servers have been stopped." -ForegroundColor Green
}
