#!/bin/bash

echo -e "\tBuilding Mobile APK\n"

echo -e "Going to mobile directory\n"
cd ../frontend/mobile || exit 1

echo -e "Cleaning flutter project\n"
flutter clean

echo -e "Building APK\n"
flutter build apk --release
if [ $? -ne 0 ]; then
    echo -e "Flutter build failed\n"
    exit 1
fi

echo -e "Returning to scripts directory\n"
cd - || exit 1

mv ../frontend/mobile/build/app/outputs/flutter-apk/app-release.apk ../builds/area.apk
if [ $? -ne 0 ]; then
    echo -e "Moving APK failed\n"
    exit 1
fi

echo -e "APK built successfully: builds/area.apk\n"
exit 0
