# =============================================================================
# Bytebot - Start Script
# =============================================================================
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$EnvFile = Join-Path $ScriptDir "docker\.env"
$ComposeFile = Join-Path $ScriptDir "docker\docker-compose.yml"

if (-not (Test-Path $EnvFile)) {
    Write-Warning "No .env file found at $EnvFile. Creating one from .env.example..."
    Copy-Item (Join-Path $ScriptDir "docker\.env.example") $EnvFile
}

Write-Host "Starting Bytebot containers..." -ForegroundColor Cyan

# Starts containers using local images without re-pulling or recreating unnecessarily
docker compose --env-file "$EnvFile" -f "$ComposeFile" up -d

Write-Host ""
Write-Host "Bytebot is running!" -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Gray
Write-Host "  Main UI:      http://localhost:9992" -ForegroundColor Yellow
Write-Host "  Desktop VNC:  http://localhost:9990/vnc" -ForegroundColor Yellow
Write-Host "  Agent API:    http://localhost:9991" -ForegroundColor Yellow
Write-Host "----------------------------------------------------" -ForegroundColor Gray
