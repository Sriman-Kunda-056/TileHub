# TileHub Pro — React Native Mobile App

## Tech: React Native 0.73 + React Navigation + CameraKit

---

## Setup

```bash
cd tilehub-mobile
npm install

# iOS (Mac only)
cd ios && pod install && cd ..

# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

---

## API URL Configuration

Edit `src/services/api.js` line 3:

```js
// Android Emulator → your PC's localhost
export const API_BASE = 'http://10.0.2.2:5000/api';

// Real Android/iOS device → your PC's IP
export const API_BASE = 'http://192.168.1.XXX:5000/api';

// Production
export const API_BASE = 'https://tilehub-api.onrender.com/api';
```

---

## Features by Role

### Owner / Admin
- Dashboard with KPIs (revenue, orders, alerts)
- **Create Bill** — 3-step wizard: customer → items → confirm
  - Auto-creates order + confirms + reserves stock + generates shipment QR
- Billing — all invoices, payment status, record payments
- Inventory — live stock, restock, critical alerts
- Orders — confirm draft → auto-shipment

### Warehouse Worker
- Shipments — pending / dispatched / delivered tabs
- **QR Scanner** — live camera scan → auto dispatch → stock deducted
- Mark delivered with one tap

### All roles
- Role-based login with demo fill button
- Secure session via AsyncStorage (persists across app restarts)
- Sign up screen for new users

---

## Key Dependency Notes

`react-native-camera-kit` requires:
- Android: minSdkVersion 24 in `android/build.gradle`
- iOS: Camera permission in `Info.plist`

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

Add to `ios/TileHubPro/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>TileHub Pro needs camera access to scan shipment QR codes</string>
```
