# Calos AI Integration - Android Configuration

## Required Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Existing permissions... -->
    
    <!-- Calos AI Permissions -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application>
        <!-- Existing config... -->
    </application>
</manifest>
```

## Firebase Configuration

1. Download `google-services.json` from Firebase Console
2. Place in `android/app/google-services.json`
3. Already configured in `android/app/build.gradle`

## Build.gradle Updates

**NO CHANGES NEEDED** - Dependencies already handled by npm packages.

The following are automatically linked:
- `@react-native-voice/voice`
- `react-native-sound`
- `@notifee/react-native`
- `@react-native-firebase/app`
- `@react-native-firebase/messaging`
- `react-native-fs`

## Native Linking (if needed)

For React Native < 0.60:
```bash
cd android
./gradlew clean
cd ..
npx react-native link
```

For React Native >= 0.60 (auto-linking):
```bash
cd android
./gradlew clean
cd ..
```

## Build Commands

```bash
# Clean build
cd mobile/android
./gradlew clean
cd ../..

# Debug APK
npm run android

# Release APK
cd mobile/android
./gradlew assembleRelease
```

## Troubleshooting

If voice recognition fails:
1. Check microphone permission in Settings
2. Restart app
3. Clear app cache

If audio playback fails:
1. Check internet connection
2. Clear audio cache: Settings → Storage → Clear cache
3. Restart app
