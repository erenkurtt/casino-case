$ErrorActionPreference = "Stop"

Write-Host "Starting local backend setup for Windows..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\.."

if (!(Test-Path ".env")) {
    Write-Host "Creating backend .env from .env.example..."
    Copy-Item ".env.example" ".env"
} else {
    Write-Host ".env already exists. Skipping."
}

Write-Host "Installing backend dependencies..."
npm install

Write-Host "Starting PostgreSQL with Docker Compose..."
docker compose up -d

Write-Host "Waiting for PostgreSQL to be ready..."
Start-Sleep -Seconds 5

Write-Host "Generating Prisma client..."
npx prisma generate

Write-Host "Running Prisma migrations..."
npx prisma migrate dev

Write-Host "Seeding database..."
npx prisma db seed

Write-Host "Running backend tests..."
npm run test

Write-Host "Backend setup completed successfully." -ForegroundColor Green
Write-Host "Start backend with: npm run start:dev"