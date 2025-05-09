#!/bin/bash

# Remove Expo-related caches and dependencies
echo "Removing Expo caches and dependencies..."
rm -rf .expo .expo-shared node_modules

# Remove package-lock.json and yarn.lock to reset package dependencies
rm -rf package-lock.json yarn.lock

# Clear Expo's cache and reset the project
echo "Clearing Expo cache and resetting project..."
expo r -c  # or use npx expo start -c

echo "Environment reset successfully."
npm install expo
docker-compose up --build
