#!/bin/bash

# Script to run all tests with coverage for all parts of the AREA project
# Usage: ./run-tests.sh [--backend] [--web] [--mobile]
# If no arguments, runs all parts

set -e  # Exit on any error

# Get the directory of the script and go to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Default: run all
run_backend=false
run_web=false
run_mobile=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      echo "Usage: $0 [--backend] [--web] [--mobile]"
      echo "Run tests with coverage for the AREA project parts."
      echo ""
      echo "Options:"
      echo "  --backend    Run backend tests"
      echo "  --web        Run web tests"
      echo "  --mobile     Run mobile tests"
      echo "  -h, --help   Show this help message"
      echo ""
      echo "If no options are specified, all tests are run."
      exit 0
      ;;
    --backend)
      run_backend=true
      shift
      ;;
    --web)
      run_web=true
      shift
      ;;
    --mobile)
      run_mobile=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [-h|--help] [--backend] [--web] [--mobile]"
      exit 1
      ;;
  esac
done

# If no specific flags, run all
if [[ "$run_backend" == false && "$run_web" == false && "$run_mobile" == false ]]; then
  run_backend=true
  run_web=true
  run_mobile=true
fi

if [[ "$run_backend" == true ]]; then
  echo "Installing backend dependencies..."
  cd backend
  npm install

  echo "Running backend tests with coverage..."
  npm test
  cd "$PROJECT_ROOT"
fi

if [[ "$run_web" == true ]]; then
  echo "Installing web dependencies..."
  cd web
  npm install

  echo "Running web tests with coverage..."
  npm run test:coverage
  cd "$PROJECT_ROOT"
fi

if [[ "$run_mobile" == true ]]; then
  echo "Installing mobile dependencies..."
  cd mobile
  flutter pub get

  echo "Running mobile tests with coverage..."
  flutter test --coverage
  cd "$PROJECT_ROOT"
fi

echo "All selected tests completed with coverage reports."
