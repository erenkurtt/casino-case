#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_PORT="3000"
FRONTEND_PORT="3001"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

run_command() {
  echo ""
  echo "Running: $*"
  "$@"
}

open_url() {
  local url="$1"

  if grep -qi microsoft /proc/version 2>/dev/null && command_exists powershell.exe; then
    powershell.exe -NoProfile -Command "Start-Process '$url'" >/dev/null 2>&1 || true
  elif command_exists xdg-open; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif command_exists open; then
    open "$url" >/dev/null 2>&1 || true
  else
    echo "Could not open browser automatically. Open manually:"
    echo "$url"
  fi
}

start_process() {
  local name="$1"
  local dir="$2"
  local command_to_run="$3"
  local log_file="$4"

  echo ""
  echo "Starting $name..."

  if command_exists gnome-terminal; then
    gnome-terminal -- bash -lc "cd '$dir' && $command_to_run; exec bash"
  elif command_exists x-terminal-emulator; then
    x-terminal-emulator -e bash -lc "cd '$dir' && $command_to_run; exec bash"
  elif command_exists konsole; then
    konsole -e bash -lc "cd '$dir' && $command_to_run; exec bash"
  elif command_exists xterm; then
    xterm -e bash -lc "cd '$dir' && $command_to_run; exec bash"
  else
    echo "No terminal emulator found. Starting $name in background."
    nohup bash -lc "cd '$dir' && $command_to_run" > "$log_file" 2>&1 &
    echo "$name logs: $log_file"
  fi
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local max_attempts=40
  local attempt=1

  echo ""
  echo "Waiting for $name at $url ..."

  while [ "$attempt" -le "$max_attempts" ]; do
    if command_exists curl; then
      if curl -fsS "$url" >/dev/null 2>&1; then
        echo "$name is ready."
        return 0
      fi
    fi

    echo "$name is not ready yet. Attempt $attempt/$max_attempts..."
    sleep 2
    attempt=$((attempt + 1))
  done

  echo "$name did not respond in time. Continuing..."
  return 0
}

echo "Starting full local setup for Casino Case..."
echo "Root directory: $ROOT_DIR"

echo ""
echo "Checking required tools..."

for cmd in node npm npx docker; do
  if ! command_exists "$cmd"; then
    echo "$cmd is not installed or not available in PATH."
    exit 1
  fi
done

echo ""
echo "Checking Docker daemon..."

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed but Docker daemon is not running."
  echo "Start Docker first, then run this script again."
  exit 1
fi

echo ""
echo "Setting up backend..."

cd "$BACKEND_DIR"

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "Creating backend .env from .env.example..."
    cp .env.example .env
  else
    echo "Creating backend .env with default local values..."
    cat > .env <<'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/game_platform_db?schema=public"
JWT_SECRET="local-dev-secret"
PORT=3000
EOF
  fi
else
  echo "backend/.env already exists. Skipping."
fi

if grep -qE '^\s*PORT\s*=' .env; then
  BACKEND_PORT="$(grep -E '^\s*PORT\s*=' .env | head -n 1 | sed -E 's/^\s*PORT\s*=\s*//' | tr -d '"')"
fi

run_command npm install
run_command docker compose up -d

echo ""
echo "Waiting for PostgreSQL container..."

MAX_DB_ATTEMPTS=30
DB_ATTEMPT=1

while [ "$DB_ATTEMPT" -le "$MAX_DB_ATTEMPTS" ]; do
  if docker exec game-platform-postgres pg_isready -U postgres -d game_platform_db >/dev/null 2>&1; then
    echo "PostgreSQL is ready."
    break
  fi

  echo "PostgreSQL is not ready yet. Attempt $DB_ATTEMPT/$MAX_DB_ATTEMPTS..."
  sleep 2
  DB_ATTEMPT=$((DB_ATTEMPT + 1))
done

if [ "$DB_ATTEMPT" -gt "$MAX_DB_ATTEMPTS" ]; then
  echo "PostgreSQL did not become ready in time."
  exit 1
fi

run_command npx prisma generate
run_command npx prisma migrate dev
run_command npx prisma db seed
run_command npm run test
run_command npm run build

echo ""
echo "Setting up frontend..."

cd "$FRONTEND_DIR"

if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    echo "Creating frontend .env.local from .env.example..."
    cp .env.example .env.local
  else
    echo "Creating frontend .env.local with default local values..."
    cat > .env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_EXCHANGE_API_URL=https://api.exchangerate-api.com/v4
EOF
  fi
else
  echo "frontend/.env.local already exists. Skipping."
fi

run_command npm install
run_command npm run build

echo ""
echo "Starting applications..."

BACKEND_URL="http://localhost:$BACKEND_PORT"
SWAGGER_URL="$BACKEND_URL/api"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

start_process "backend" "$BACKEND_DIR" "npm run start:dev" "$BACKEND_DIR/backend-dev.log"

wait_for_url "backend Swagger" "$SWAGGER_URL"

start_process "frontend" "$FRONTEND_DIR" "npm run dev -- -p $FRONTEND_PORT" "$FRONTEND_DIR/frontend-dev.log"

wait_for_url "frontend" "$FRONTEND_URL"

echo ""
echo "Opening browser windows..."
open_url "$SWAGGER_URL"
open_url "$FRONTEND_URL"

echo ""
echo "Full local setup completed successfully."
echo "Backend API: $BACKEND_URL"
echo "Swagger UI: $SWAGGER_URL"
echo "Frontend: $FRONTEND_URL"