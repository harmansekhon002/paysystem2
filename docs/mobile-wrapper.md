# Mobile Wrapper Setup (Capacitor)

This project now includes Capacitor so you can package it as a mobile app.

## 1) Set your production URL

Capacitor loads your hosted app URL from:

`NEXT_PUBLIC_APP_URL`

Example:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 2) Install platform projects (one-time)

```bash
npm run mobile:add:android
npm run mobile:add:ios
```

## 3) Sync web/native config

```bash
npm run mobile:sync
```

## 4) Open native IDE projects

```bash
npm run mobile:open:android
npm run mobile:open:ios
```

## 5) Build for stores

- Android: use Android Studio to build `AAB` for Play Store.
- iOS: use Xcode to archive for App Store.

## Notes

- `capacitor.config.ts` is configured for hosted URL mode (recommended for this Next.js setup).
- PWA install support is also enabled via `app/manifest.ts` and install prompt UI.
