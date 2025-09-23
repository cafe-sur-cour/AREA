#!/bin/bash

YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m'

echo -e "${YELLOW}\tRunning Mobile Debug${NC}"

echo -e "\n${YELLOW}Going to mobile directory...${NC}"
cd ../mobile || exit 1

echo -e "\n${YELLOW}Cleaning flutter project...${NC}"
flutter clean

echo -e "\n${YELLOW}Running flutter project in debug mode...${NC}"
flutter run
if [ $? -ne 0 ]; then
    echo -e "\n${RED}Flutter run failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Returning to scripts directory...${NC}"
cd - || exit 1

echo -e "\n${GREEN}Mobile debug run successfully${NC}"
exit 0
