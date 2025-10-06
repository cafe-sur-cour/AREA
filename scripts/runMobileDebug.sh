#!/bin/bash

YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MOBILE_DIR="$PROJECT_ROOT/mobile"
ENV_FILE="$PROJECT_ROOT/deployment/.env"

echo -e "${YELLOW}\tRunning Mobile Debug${NC}"

if [ -f "$ENV_FILE" ]; then
    echo -e "\n${YELLOW}Loading environment variables from deployment/.env...${NC}"
    export $(cat "$ENV_FILE" | grep -v '^#' | grep -v '^$' | xargs)
fi

echo -e "\n${YELLOW}Going to mobile directory...${NC}"
cd "$MOBILE_DIR" || exit 1

echo -e "\n${YELLOW}Cleaning flutter project...${NC}"
flutter clean

echo -e "\n${YELLOW}Running flutter project in debug mode...${NC}"
flutter run --dart-define=FRONTEND_URL="$FRONTEND_URL"
if [ $? -ne 0 ]; then
    echo -e "\n${RED}Flutter run failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}Mobile debug run successfully${NC}"
exit 0
