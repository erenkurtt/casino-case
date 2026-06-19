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

function Wait-ForUrl {
    param (
        [string]$Name,
        [string]$Url
    )

    Write-Host ""
    Write-Host "Waiting for $Name at $Url ..."

    $maxAttempts = 40
    $attempt = 1

    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2

            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                Write-Host "$Name is ready." -ForegroundColor Green
                return
            }
        } catch {
            Write-Host "$Name is not ready yet. Attempt $attempt/$maxAttempts..."
        }

        Start-Sleep -Seconds 2
        $attempt++
    }

    Write-Host "$Name did not respond in time. Continuing..." -ForegroundColor Yellow
}

Write-Host "Starting full local setup for Casino Case..." -ForegroundColor Cyan

$RootDir = Resolve-Path "$PSScriptRoot\.."
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"

$BackendPort = "3000"
$FrontendPort = "3001"

Write-Host "Root directory: $RootDir"

Write-Host ""
Write-Host "Checking required tools..."

Assert-CommandExists "node"
Assert-CommandExists "npm"
Assert-CommandExists "npx"
Assert-CommandExists "docker"

Write-Host ""
Write-Host "Checking Docker daemon..."

docker info *> $null

if ($LASTEXITCODE -ne 0) {
    throw @"
Docker is installed but the Docker daemon is not running.

Fix options:
1. Start Docker Desktop on Windows.
2. Or run scripts/setup-linux.sh inside WSL if Docker is installed there.
"@
}

Write-Host ""
Write-Host "Setting up backend..." -ForegroundColor Cyan

Set-Location $BackendDir

if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "Creating backend .env from .env.example..."
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "Creating backend .env with default local values..."
        @"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/game_platform_db?schema=public"
JWT_SECRET="local-dev-secret"
PORT=3000
"@ | Set-Content ".env"
    }
} else {
    Write-Host "backend/.env already exists. Skipping."
}

if (Test-Path ".env") {
    $portLine = Get-Content ".env" | Where-Object { $_ -match "^\s*PORT\s*=" } | Select-Object -First 1

    if ($portLine) {
        $BackendPort = ($portLine -replace "^\s*PORT\s*=\s*", "").Trim().Trim('"')
    }
}

Run-Command "npm" @("install")
Run-Command "docker" @("compose", "up", "-d")

Write-Host ""
Write-Host "Waiting for PostgreSQL container..."

$maxDbAttempts = 30
$dbAttempt = 1

while ($dbAttempt -le $maxDbAttempts) {
    docker exec game-platform-postgres pg_isready -U postgres -d game_platform_db *> $null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL is ready." -ForegroundColor Green
        break
    }

    Write-Host "PostgreSQL is not ready yet. Attempt $dbAttempt/$maxDbAttempts..."
    Start-Sleep -Seconds 2
    $dbAttempt++
}

if ($dbAttempt -gt $maxDbAttempts) {
    throw "PostgreSQL did not become ready in time."
}

Run-Command "npx" @("prisma", "generate")
Run-Command "npx" @("prisma", "migrate", "dev")
Run-Command "npx" @("prisma", "db", "seed")
Run-Command "npm" @("run", "test")
Run-Command "npm" @("run", "build")

Write-Host ""
Write-Host "Setting up frontend..." -ForegroundColor Cyan

Set-Location $FrontendDir

if (!(Test-Path ".env.local")) {
    if (Test-Path ".env.example") {
        Write-Host "Creating frontend .env.local from .env.example..."
        Copy-Item ".env.example" ".env.local"
    } else {
        Write-Host "Creating frontend .env.local with default local values..."
        @"
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_EXCHANGE_API_URL=https://api.exchangerate-api.com/v4
"@ | Set-Content ".env.local"
    }
} else {
    Write-Host "frontend/.env.local already exists. Skipping."
}

Run-Command "npm" @("install")
Run-Command "npm" @("run", "build")

Write-Host ""
Write-Host "Starting applications..." -ForegroundColor Cyan

$BackendUrl = "http://localhost:$BackendPort"
$SwaggerUrl = "$BackendUrl/api"
$FrontendUrl = "http://localhost:$FrontendPort"

$escapedBackendPath = $BackendDir.ToString().Replace("'", "''")
$escapedFrontendPath = $FrontendDir.ToString().Replace("'", "''")

$backendCommand = "Set-Location -LiteralPath '$escapedBackendPath'; npm run start:dev"
$frontendCommand = "Set-Location -LiteralPath '$escapedFrontendPath'; npm run dev -- -p $FrontendPort"

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $backendCommand
)

Wait-ForUrl "backend Swagger" $SwaggerUrl

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $frontendCommand
)

Wait-ForUrl "frontend" $FrontendUrl

Write-Host ""
Write-Host "Opening browser windows..." -ForegroundColor Cyan

Start-Process $SwaggerUrl
Start-Process $FrontendUrl

Write-Host ""
Write-Host "Full local setup completed successfully." -ForegroundColor Green
Write-Host "Backend API: $BackendUrl"
Write-Host "Swagger UI: $SwaggerUrl"
Write-Host "Frontend: $FrontendUrl"