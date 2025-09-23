#!/bin/bash

YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m'

echo -e "${YELLOW}\tBuilding Mobile APK${NC}"

echo -e "\n${YELLOW}Going to mobile directory...${NC}"
cd ../mobile || exit 1

echo -e "\n${YELLOW}Cleaning flutter project...${NC}"
flutter clean

echo -e "\n${YELLOW}Building APK...${NC}"
flutter build apk --release
if [ $? -ne 0 ]; then
    echo -e "\n${RED}Flutter build failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Returning to scripts directory...${NC}"
cd - || exit 1

echo -e "\n${YELLOW}Moving the APK to builds/ directory...${NC}"
mv ../mobile/build/app/outputs/flutter-apk/app-release.apk ../builds/area.apk
if [ $? -ne 0 ]; then
    echo -e "\n${RED}Moving APK failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}APK built successfully: builds/area.apk${NC}"
exit 0
