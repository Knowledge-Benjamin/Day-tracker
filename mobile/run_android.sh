#!/bin/bash

# Set Java Home to Android Studio's bundled JDK
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export PATH="$JAVA_HOME/bin:$PATH"

echo "☕ Java environment configured."
echo "📱 Checking for connected devices..."

# Run the app
npx react-native run-android
