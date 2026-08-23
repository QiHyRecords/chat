# Native Architecture Compatibility Notes

Chat uses Expo SDK 54 with React Native 0.81, Reanimated 4, and React Native Worklets. The Android build must keep the React Native New Architecture enabled. The project therefore sets `newArchEnabled: true` in `app.config.ts`; generated Android output carries the same setting in `android/gradle.properties`.

All installed Expo modules are checked against the SDK 54-compatible package set using `pnpm exec expo install --check`. The optional `react-native-video-trim` dependency declares support for both the New and legacy architectures. Its JavaScript module is loaded only within the video trimming flow, not at app startup, so the authenticated route tree does not eagerly resolve it.

The generated Android project must be refreshed with `pnpm exec expo prebuild --platform android --no-install` after native configuration changes, then built from the regenerated source.
