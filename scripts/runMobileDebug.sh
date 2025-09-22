#!/bin/bash

echo -e "\tRunning Mobile Debug\n"

echo -e "Going to mobile directory\n"
cd ../frontend/mobile || exit 1

echo -e "Cleaning flutter project\n"
flutter clean

echo -e "Running flutter project in debug mode\n"
flutter run

echo -e "Returning to scripts directory\n"
cd - || exit 1

echo -e "Mobile debug run successfully\n"
exit 0
