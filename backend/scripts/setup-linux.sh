#!/usr/bin/env bash

set -e

echo "Starting local backend setup for Linux/WSL..."

cd "$(dirname "$0")/.."

if [ ! -f ".env" ]; then
  echo "Creating backend .env from .env.example..."
  cp .env.example .env
else
  echo ".env already exists. Skipping."
fi

echo "Installing backend dependencies..."
npm install

echo "Starting PostgreSQL with Docker Compose..."
docker compose up -d

echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma migrations..."
npx prisma migrate dev

echo "Seeding database..."
npx prisma db seed

echo "Running backend tests..."
npm run test

echo "Backend setup completed successfully."
echo "Start backend with:"
echo "npm run start:dev"