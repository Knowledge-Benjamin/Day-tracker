# Building APK for Android

## 📱 Quick Build

To build an installable APK:

```bash
cd mobile
chmod +x build_apk.sh
./build_apk.sh
```

This will create: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📲 Installing on Your Phone

### Method 1: USB Transfer
1. Connect your phone to PC via USB
2. Copy `app-release.apk` to your phone's Downloads folder
3. On your phone, go to **Settings** → **Security** → Enable **Install from Unknown Sources**
4. Open the APK file and tap **Install**

### Method 2: Google Drive/Email
1. Upload `app-release.apk` to Google Drive or email it to yourself
2. Download on your phone
3. Enable **Install from Unknown Sources**
4. Tap the APK to install

---

## 🔧 Build Configuration

The app is configured to connect to your production backend:
```
API_BASE_URL=https://day-tracker-93ly.onrender.com/api
```

---

## 🔐 Signing APK (Optional - For Production)

For a properly signed APK (recommended for distribution):

### 1. Generate Keystore
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore day-tracker.keystore -alias day-tracker-key -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Create gradle.properties
```bash
# android/gradle.properties
MYAPP_UPLOAD_STORE_FILE=day-tracker.keystore
MYAPP_UPLOAD_KEY_ALIAS=day-tracker-key
MYAPP_UPLOAD_STORE_PASSWORD=your_keystore_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

### 3. Update android/app/build.gradle
Add this before `buildTypes`:
```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
}
```

And update buildTypes:
```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

---

## 📊 APK Details

- **Size**: ~20-50 MB (depending on optimizations)
- **Min Android Version**: 6.0 (API 23)
- **Target Android Version**: 14 (API 34)

---

## 🐛 Troubleshooting

**Build fails with "JAVA_HOME not set":**
- The script sets it automatically, but ensure Android Studio is installed at default location

**APK won't install:**
- Make sure "Install from Unknown Sources" is enabled
- Check Android version is 6.0 or higher

**App crashes on startup:**
- Check backend is running: https://day-tracker-93ly.onrender.com/api/health
- Verify API_BASE_URL in `.env` is correct

---

## 🚀 Next Steps

After installing:
1. Open the app
2. Register a new account
3. Create your first goal
4. Start tracking your journey!

Your data will be stored on your Render backend and synced across devices.
