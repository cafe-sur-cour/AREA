#!/bin/bash

echo -e "\tRunning Mobile Release\n"

echo -e "Going to mobile directory\n"
cd ../frontend/mobile || exit 1

echo -e "Cleaning flutter project\n"
flutter clean

echo -e "Running flutter project in release mode\n"
flutter run --release

echo -e "Returning to scripts directory\n"
cd - || exit 1

echo -e "Mobile release run successfully\n"
exit 0
