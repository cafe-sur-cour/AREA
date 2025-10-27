#!/bin/bash

# Script to run all tests with coverage for all parts of the AREA project
# Usage: ./run-tests.sh [--backend] [--web] [--mobile]
# If no arguments, runs all parts

set -e  # Exit on any error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ASCII Art separators
HEADER_LINE="═══════════════════════════════════════════════════════════════════════════════════════════════════════"
SECTION_LINE="───────────────────────────────────────────────────────────────────────────────────────────────────────"
BOX_TOP="┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐"
BOX_MIDDLE="│                                                                                                     │"
BOX_BOTTOM="└─────────────────────────────────────────────────────────────────────────────────────────────────────┘"
BOX_SIDE="│"
BOX_WIDTH=99  # Width between the box borders (excluding │ characters)

# Function to center text in a box
center_text() {
  local text="$1"
  local width=$BOX_WIDTH
  local text_length=${#text}
  local total_padding=$((width - text_length))
  local left_padding=$((total_padding / 2))
  local right_padding=$((total_padding - left_padding))
  local left_str=""
  local right_str=""

  for ((i=0; i<left_padding; i++)); do
    left_str="${left_str} "
  done

  for ((i=0; i<right_padding; i++)); do
    right_str="${right_str} "
  done

  echo "${BOX_SIDE}${left_str}${text}${right_str}${BOX_SIDE}"
}

# Emojis
ROCKET="🚀"
GEAR="⚙️"
CHECK="✅"
CROSS="❌"
PACKAGE="📦"
TEST="🧪"
COVERAGE="📊"
BROWSER="🌐"

# Function to open HTML report in browser
open_coverage_report() {
  local report_path="$1"
  if [[ "$open_browser" == true ]]; then
    if [[ -f "$report_path" ]]; then
      echo -e "${BLUE}${BROWSER} Opening coverage report: $report_path${NC}"
      if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$report_path"
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$report_path"
      elif command -v firefox >/dev/null 2>&1; then
        firefox "$report_path"
      else
        echo -e "${YELLOW}Could not automatically open browser. Please open manually: $report_path${NC}"
      fi
    else
      echo -e "${RED}${CROSS} Coverage report not found: $report_path${NC}"
    fi
  else
    if [[ -f "$report_path" ]]; then
      echo -e "${BLUE}${BROWSER} Coverage report available: $report_path${NC}"
    else
      echo -e "${RED}${CROSS} Coverage report not found: $report_path${NC}"
    fi
  fi
}

# Default: run all
run_backend=false
run_web=false
run_mobile=false
open_browser=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      echo -e "${BOLD}${BLUE}AREA Test Runner${NC} ${ROCKET}"
      echo "Run tests with coverage for the AREA project parts."
      echo ""
      echo -e "${YELLOW}Usage:${NC} $0 [--backend] [--web] [--mobile] [--open-browser]"
      echo ""
      echo -e "${CYAN}Options:${NC}"
      echo "  --backend      ${GEAR} Run backend tests"
      echo "  --web          ${BROWSER} Run web tests"
      echo "  --mobile       📱 Run mobile tests"
      echo "  --open-browser 🌐 Open coverage reports in browser"
      echo "  -h, --help     ❓ Show this help message"
      echo ""
      echo "If no options are specified, all tests are run."
      echo "Coverage reports are generated but not opened in browser by default."
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
    --open-browser)
      open_browser=true
      shift
      ;;
    *)
      echo -e "${RED}${CROSS} Unknown option: $1${NC}"
      echo -e "${YELLOW}Usage:${NC} $0 [-h|--help] [--backend] [--web] [--mobile] [--open-browser]"
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

# Display header
echo -e "${BLUE}${HEADER_LINE}${NC}"
echo -e "${BLUE}${BOX_TOP}${NC}"
echo -e "${BLUE}$(center_text "🚀 AREA TEST RUNNER 🚀")${NC}"
echo -e "${BLUE}${BOX_BOTTOM}${NC}"
echo -e "${BLUE}${HEADER_LINE}${NC}"
echo ""

if [[ "$run_backend" == true ]]; then
  echo -e "${CYAN}${SECTION_LINE}${NC}"
  echo -e "${CYAN}${BOX_TOP}${NC}"
  echo -e "${CYAN}$(center_text "🔧 BACKEND TESTS 🔧")${NC}"
  echo -e "${CYAN}${BOX_BOTTOM}${NC}"
  echo -e "${CYAN}${SECTION_LINE}${NC}"
  echo ""

  echo -e "${BLUE}${PACKAGE} Installing backend dependencies...${NC}"
  cd backend
  npm install --silent

  echo -e "${GREEN}${TEST} Running backend tests with coverage...${NC}"
  npm test

  # Open coverage report
  open_coverage_report "coverage/lcov-report/index.html"

  cd "$PROJECT_ROOT"
  echo ""
fi

if [[ "$run_web" == true ]]; then
  echo -e "${PURPLE}${SECTION_LINE}${NC}"
  echo -e "${PURPLE}${BOX_TOP}${NC}"
  echo -e "${PURPLE}$(center_text "🌐 WEB TESTS 🌐")${NC}"
  echo -e "${PURPLE}${BOX_BOTTOM}${NC}"
  echo -e "${PURPLE}${SECTION_LINE}${NC}"
  echo ""

  echo -e "${BLUE}${PACKAGE} Installing web dependencies...${NC}"
  cd web
  npm install --silent

  echo -e "${GREEN}${TEST} Running web tests with coverage...${NC}"
  npm run test:coverage

  # Open coverage report
  open_coverage_report "coverage/lcov-report/index.html"

  cd "$PROJECT_ROOT"
  echo ""
fi

if [[ "$run_mobile" == true ]]; then
  echo -e "${GREEN}${SECTION_LINE}${NC}"
  echo -e "${GREEN}${BOX_TOP}${NC}"
  echo -e "${GREEN}$(center_text "📱 MOBILE TESTS 📱")${NC}"
  echo -e "${GREEN}${BOX_BOTTOM}${NC}"
  echo -e "${GREEN}${SECTION_LINE}${NC}"
  echo ""

  echo -e "${BLUE}${PACKAGE} Installing mobile dependencies...${NC}"
  cd mobile
  flutter pub get >/dev/null 2>&1

  echo -e "${GREEN}${TEST} Running mobile tests with coverage...${NC}"
  flutter test --coverage --branch-coverage

  echo -e "${PURPLE}${COVERAGE} Generating HTML coverage report...${NC}"
  if command -v genhtml >/dev/null 2>&1 && command -v lcov >/dev/null 2>&1; then
    echo -e "${CYAN}Coverage summary:${NC}"
    lcov --summary coverage/lcov.info 2>/dev/null | grep -E "(lines|functions|branches)" || echo -e "${YELLOW}Note: Flutter coverage only provides line coverage data.${NC}"
    echo ""
    genhtml --quiet coverage/lcov.info -o coverage/html
    echo -e "${GREEN}${CHECK} Coverage report generated in mobile/coverage/html/${NC}"
    echo -e "${BLUE}Open mobile/coverage/html/index.html in your browser to view the report${NC}"

    # Open coverage report
    open_coverage_report "coverage/html/index.html"
  else
    echo -e "${RED}${CROSS} lcov/genhtml not found. Install lcov to generate coverage reports and summaries.${NC}"
    if command -v apt-get >/dev/null 2>&1; then
      echo "On Ubuntu/Debian: sudo apt-get install lcov"
    elif command -v dnf >/dev/null 2>&1; then
      echo "On Fedora/RHEL: sudo dnf install lcov"
    elif command -v yum >/dev/null 2>&1; then
      echo "On CentOS/RHEL: sudo yum install lcov"
    elif command -v pacman >/dev/null 2>&1; then
      echo "On Arch Linux: sudo pacman -S lcov"
    elif command -v brew >/dev/null 2>&1; then
      echo "On macOS: brew install lcov"
    else
      echo "Please install lcov using your system's package manager."
    fi
    echo "Coverage data is available in mobile/coverage/lcov.info"
  fi

  cd "$PROJECT_ROOT"
  echo ""
fi

if [[ "$open_browser" == true ]]; then
  echo -e "${GREEN}${CHECK} All selected tests completed with coverage reports.${NC} ${ROCKET}"
else
  echo -e "${GREEN}${CHECK} All selected tests completed with coverage reports.${NC} ${ROCKET}"
fi

echo ""
echo -e "${YELLOW}${HEADER_LINE}${NC}"
echo -e "${YELLOW}${BOX_TOP}${NC}"
echo -e "${YELLOW}$(center_text "🎉 TEST EXECUTION COMPLETE! 🎉")${NC}"
echo -e "${YELLOW}${BOX_BOTTOM}${NC}"
echo -e "${YELLOW}${HEADER_LINE}${NC}"
