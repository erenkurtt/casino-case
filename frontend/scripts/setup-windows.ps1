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

Write-Host "Starting local frontend setup for Windows..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\.."

Write-Host "Checking required tools..."

Assert-CommandExists "node"
Assert-CommandExists "npm"

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
    Write-Host ".env.local already exists. Skipping."
}

Write-Host "Installing frontend dependencies..."
Run-Command "npm" @("install")

Write-Host "Building frontend..."
Run-Command "npm" @("run", "build")

Write-Host ""
Write-Host "Frontend setup completed successfully." -ForegroundColor Green

$frontendPath = (Get-Location).Path
$escapedFrontendPath = $frontendPath.Replace("'", "''")

$port = "3001"
$frontendUrl = "http://localhost:$port"

Write-Host "Starting frontend server in a new PowerShell window..." -ForegroundColor Cyan

$serverCommand = "Set-Location -LiteralPath '$escapedFrontendPath'; npm run dev -- -p $port"

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $serverCommand
)

Write-Host "Waiting for frontend to become available at $frontendUrl ..."

$maxAttempts = 30
$attempt = 1
$serverReady = $false

while ($attempt -le $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 2

        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            $serverReady = $true
            break
        }
    } catch {
        Write-Host "Frontend is not ready yet. Attempt $attempt/$maxAttempts..."
    }

    Start-Sleep -Seconds 2
    $attempt++
}

if ($serverReady) {
    Write-Host "Frontend is running. Opening browser..." -ForegroundColor Green
} else {
    Write-Host "Frontend did not respond in time, opening URL anyway..." -ForegroundColor Yellow
}

Start-Process $frontendUrl