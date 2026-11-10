# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/Daki1389/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/Daki1389/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/Daki1389/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/Daki1389/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/Daki1389/PlayGround).
- 🛠️ [Check build runs](https://github.com/Daki1389/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/Daki1389/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/Daki1389).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

## Touchline '26

A full football-manager game built with React, Vite and an Express API. Manage
Northgate United through a 14-match season: pick tactics, sign players, upgrade
facilities and watch every match play out live.

### Web

```bash
npm install
npm run dev      # API on :3000 and Vite on :5173
npm run build
npm start        # production API + built frontend on :3000
```

### Android (Capacitor)

The Android project lives in `android/` and is configured by
`capacitor.config.json` (app id `com.touchline.footballmanager`, web assets from
`dist/`).

Requirements: Android SDK and JDK 17 (Capacitor 6 / Gradle 8.2).

```bash
npm install
npm run cap:sync      # build the web app and copy it into Android
npm run android       # open the native project in Android Studio
npm run android:build # or build a debug APK from the command line
```

The debug APK is written to
`android/app/build/outputs/apk/debug/app-debug.apk`.

The packaged app runs a bundled offline game engine, so it is fully playable
without the Express server. To use a hosted backend instead, build with a base
URL, for example `VITE_API_BASE=https://api.example.com npm run cap:sync`. The
same fallback automatically takes over on the web when the API is unavailable.
