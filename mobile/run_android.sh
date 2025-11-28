#!/bin/bash

# Set Java Home to Android Studio's bundled JDK
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export PATH="$JAVA_HOME/bin:$PATH"

echo "☕ Java environment configured."
echo "🧹 Cleaning Android build..."

# Clean the Android build
cd android
./gradlew clean
cd ..

echo "📱 Building and installing app..."
npx react-native run-android
