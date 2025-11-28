#!/bin/bash

# Set Java Home to Android Studio's bundled JDK
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export PATH="$JAVA_HOME/bin:$PATH"

echo "🏗️  Building Release APK..."
echo "☕ Java environment configured."
echo ""

# Clean build
cd android
./gradlew clean
echo ""

# Build release APK
echo "📦 Building APK (this may take a few minutes)..."
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📱 Your APK is ready at:"
    echo "   android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "📲 To install on your phone:"
    echo "   1. Transfer the APK to your phone"
    echo "   2. Enable 'Install from Unknown Sources' in Settings"
    echo "   3. Tap the APK file to install"
else
    echo ""
    echo "❌ Build failed. Check the errors above."
fi
