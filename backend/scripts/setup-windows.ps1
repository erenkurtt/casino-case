$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSVersion.Major -ge 7) {
    $PSNativeCommandUseErrorActionPreference = $true
}

function Run-Command {
    param (
        [string]$Command,
        [string[]]$Arguments
    )

    Write-Host ""
    Write-Host "Running: $Command $($Arguments -join ' ')" -ForegroundColor Cyan

    & $Command @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE : $Command $($Arguments -join ' ')"
    }
}

function Assert-CommandExists {
    param (
        [string]$Command
    )

    $exists = Get-Command $Command -ErrorAction SilentlyContinue

    if (-not $exists) {
        throw "$Command is not installed or not available in PATH."
    }
}

Write-Host "Starting local backend setup for Windows..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\.."

Write-Host "Checking required tools..."

Assert-CommandExists "node"
Assert-CommandExists "npm"
Assert-CommandExists "npx"
Assert-CommandExists "docker"

Write-Host "Checking Docker daemon..."

docker info *> $null

if ($LASTEXITCODE -ne 0) {
    throw @"
Docker is installed but the Docker daemon is not running.

Fix options:
1. Start Docker Desktop on Windows.
2. Or run the Linux/WSL setup script inside WSL if Docker is installed there.
3. Or use a remote PostgreSQL DATABASE_URL in .env instead of local Docker PostgreSQL.
"@
}

if (!(Test-Path ".env")) {
    Write-Host "Creating backend .env from .env.example..."
    Copy-Item ".env.example" ".env"
} else {
    Write-Host ".env already exists. Skipping."
}

Write-Host "Installing backend dependencies..."
Run-Command "npm" @("install")

Write-Host "Starting PostgreSQL with Docker Compose..."
Run-Command "docker" @("compose", "up", "-d")

Write-Host "Waiting for PostgreSQL to be ready..."

$maxAttempts = 30
$attempt = 1

while ($attempt -le $maxAttempts) {
    docker exec game-platform-postgres pg_isready -U postgres -d game_platform_db *> $null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL is ready." -ForegroundColor Green
        break
    }

    Write-Host "PostgreSQL is not ready yet. Attempt $attempt/$maxAttempts..."
    Start-Sleep -Seconds 2
    $attempt++
}

if ($attempt -gt $maxAttempts) {
    throw "PostgreSQL did not become ready in time."
}

Write-Host "Generating Prisma client..."
Run-Command "npx" @("prisma", "generate")

Write-Host "Running Prisma migrations..."
Run-Command "npx" @("prisma", "migrate", "dev")

Write-Host "Seeding database..."
Run-Command "npx" @("prisma", "db", "seed")

Write-Host "Running backend tests..."
Run-Command "npm" @("run", "test")

Write-Host ""
Write-Host "Backend setup completed successfully." -ForegroundColor Green

$backendPath = (Get-Location).Path
$escapedBackendPath = $backendPath.Replace("'", "''")

$port = "3000"

if (Test-Path ".env") {
    $portLine = Get-Content ".env" | Where-Object { $_ -match "^\s*PORT\s*=" } | Select-Object -First 1

    if ($portLine) {
        $port = ($portLine -replace "^\s*PORT\s*=\s*", "").Trim().Trim('"')
    }
}

$swaggerUrl = "http://localhost:$port/api"

Write-Host "Starting backend server in a new PowerShell window..." -ForegroundColor Cyan

$serverCommand = "Set-Location -LiteralPath '$escapedBackendPath'; npm run start:dev"

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $serverCommand
)

Write-Host "Waiting for backend to become available at $swaggerUrl ..."

$maxAttempts = 30
$attempt = 1
$serverReady = $false

while ($attempt -le $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri $swaggerUrl -UseBasicParsing -TimeoutSec 2

        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            $serverReady = $true
            break
        }
    } catch {
        Write-Host "Backend is not ready yet. Attempt $attempt/$maxAttempts..."
    }

    Start-Sleep -Seconds 2
    $attempt++
}

if ($serverReady) {
    Write-Host "Backend is running. Opening Swagger UI..." -ForegroundColor Green
} else {
    Write-Host "Backend did not respond in time, opening Swagger URL anyway..." -ForegroundColor Yellow
}

Start-Process $swaggerUrl