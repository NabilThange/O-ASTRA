# =============================================================================
# Bytebot - Stop Script
# =============================================================================
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$EnvFile = Join-Path $ScriptDir "docker\.env"
$ComposeFile = Join-Path $ScriptDir "docker\docker-compose.yml"

Write-Host "Stopping Bytebot containers (preserving containers, volumes, and images)..." -ForegroundColor Cyan

# Stops running containers without deleting them or removing image cache
docker compose --env-file "$EnvFile" -f "$ComposeFile" stop

Write-Host ""
Write-Host "All Bytebot containers stopped successfully." -ForegroundColor Green
Write-Host "Run .\start.ps1 to resume instantly without downloading or pulling images." -ForegroundColor Gray
