# TileHub Pro — Full-Stack Tile Operations Platform

TileHub combines a React Native field app, a Next.js web dashboard, and a
Node/PostgreSQL API for tile inventory, billing, orders, customers, analytics,
and QR-driven warehouse dispatch.

![Surfaces](https://img.shields.io/badge/application_surfaces-3-2563eb)
![Mobile screens](https://img.shields.io/badge/mobile_screens-18-7c3aed)
![Web routes](https://img.shields.io/badge/web_routes-17-0ea5e9)
![API modules](https://img.shields.io/badge/API_route_modules-11-2ea44f)
![React Native](https://img.shields.io/badge/React_Native-0.73.4-61dafb)

[Configured web deployment](https://tile-hub.vercel.app)

## Evidence at a glance

| Verified from the repository tree | Count |
| --- | ---: |
| Application surfaces: mobile, web, API | **3** |
| React Native screens | **18** |
| Web route pages | **17** |
| Backend route modules | **11** |
| Backend controllers | **6** |

## Preview

No reviewed UI capture is embedded yet. The GitHub-rendered service diagram is
used as the public preview until a synthetic-data screenshot is available.

## Architecture

```mermaid
flowchart LR
    M["React Native mobile<br/>owner + warehouse workflows"]
    W["Next.js web dashboard"]
    API["Node API<br/>11 route modules"]
    DB[("PostgreSQL")]
    CL["Cloudinary"]
    TW["Twilio"]

    M --> API
    W --> API
    API --> DB
    API --> CL
    API --> TW
```

> **Repository status:** generated dependency folders and the React Native debug
> keystore are excluded from the current source tree. Production signing keys
> and environment secrets must never be committed.

## Quick start

### Mobile app

```bash
git clone https://github.com/Sriman-Kunda-056/TileHub.git
cd TileHub
npm install
npm start

# In another terminal
npm run android
```

For iOS on macOS, install Pods in `ios/` and run `npm run ios`.

### Backend API

```bash
cd backend
npm install
node server.js
```

### Web dashboard

```bash
cd frontend
npm install
npm run dev
```

Each surface has its own environment configuration. Use example files when
present and keep JWT, Cloudinary, Twilio, database, and deployment credentials
out of Git.

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

## What it does

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

## Tests and validation

No automated end-to-end or unit-test suite is tracked in the source-only
repository. Before a release, validate with synthetic inventory and accounts:

1. Start the API, web dashboard, and mobile client.
2. Create a bill and confirm the resulting order and stock reservation.
3. Generate and scan a shipment QR code.
4. Confirm dispatch and delivery state transitions.
5. Verify role boundaries and failed-network recovery on mobile.

## Repository layout

```text
TileHub/
|-- src/                  # React Native screens, navigation, and services
|-- android/              # Android application project; no signing secrets
|-- backend/              # Node API, routes, controllers, and database access
|-- frontend/             # Next.js web dashboard
|-- database/             # Database support files
|-- App.js                # React Native root
|-- package.json          # Mobile scripts and dependencies
`-- render.yaml           # API deployment configuration
```

## Limitations

- The three application surfaces do not have a tracked automated integration
  suite.
- Demo authentication and client-side session storage require a production
  security review.
- Billing, payments, inventory reconciliation, and warehouse dispatch require
  transactional and audit controls before real operational use.
- Camera permissions and device networking differ between emulators and physical
  devices.
- JWT, PostgreSQL, Cloudinary, Twilio, and signing credentials must remain out of
  Git and be rotated if exposed.

## Numbered commit history

1. `Initial` - import the mobile, web, and API implementation.
2. `01` - remove generated dependencies and signing artifacts, then document the platform.
3. `02` - standardize the evidence-first GitHub README format.

## Suggested GitHub topics

`react-native` `nextjs` `nodejs` `postgresql` `inventory-management`
`billing` `warehouse-management` `qr-code` `tailwindcss`

## License and attribution

No repository-wide license file is included. React Native, Next.js, PostgreSQL,
Cloudinary, Twilio, and other dependencies remain subject to their respective
licenses and service terms.
