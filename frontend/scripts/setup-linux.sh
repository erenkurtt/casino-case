#!/usr/bin/env bash

set -euo pipefail

run_command() {
  echo ""
  echo "Running: $*"
  "$@"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
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
    echo "Could not open browser automatically. Open this URL manually:"
    echo "$url"
  fi
}

start_server() {
  local frontend_path="$1"
  local port="$2"
  local command_to_run="cd '$frontend_path' && npm run dev -- -p $port; exec bash"

  echo "Starting frontend server..."

  if command_exists gnome-terminal; then
    gnome-terminal -- bash -lc "$command_to_run"
  elif command_exists x-terminal-emulator; then
    x-terminal-emulator -e bash -lc "$command_to_run"
  elif command_exists konsole; then
    konsole -e bash -lc "$command_to_run"
  elif command_exists xterm; then
    xterm -e bash -lc "$command_to_run"
  else
    echo "No terminal emulator found. Starting frontend in background..."
    nohup bash -lc "cd '$frontend_path' && npm run dev -- -p $port" > frontend-dev.log 2>&1 &
    echo "Frontend logs: $frontend_path/frontend-dev.log"
  fi
}

wait_for_server() {
  local url="$1"
  local max_attempts=30
  local attempt=1

  echo "Waiting for frontend to become available at $url ..."

  while [ "$attempt" -le "$max_attempts" ]; do
    if command_exists curl; then
      if curl -fsS "$url" >/dev/null 2>&1; then
        echo "Frontend is running."
        return 0
      fi
    else
      sleep 5
      return 0
    fi

    echo "Frontend is not ready yet. Attempt $attempt/$max_attempts..."
    sleep 2
    attempt=$((attempt + 1))
  done

  echo "Frontend did not respond in time. Opening URL anyway..."
  return 0
}

echo "Starting local frontend setup for Linux/WSL..."

cd "$(dirname "$0")/.."

echo "Checking required tools..."

if ! command_exists node; then
  echo "node is not installed or not available in PATH."
  exit 1
fi

if ! command_exists npm; then
  echo "npm is not installed or not available in PATH."
  exit 1
fi

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
  echo ".env.local already exists. Skipping."
fi

echo "Installing frontend dependencies..."
run_command npm install

echo "Building frontend..."
run_command npm run build

echo ""
echo "Frontend setup completed successfully."

FRONTEND_PATH="$(pwd)"
PORT="3001"
FRONTEND_URL="http://localhost:$PORT"

start_server "$FRONTEND_PATH" "$PORT"
wait_for_server "$FRONTEND_URL"
open_url "$FRONTEND_URL"

echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend should be running at: http://localhost:3000"