# Chat

Chat is an Android-first Expo messaging application with Supabase authentication, secure profiles, private and group conversations, realtime text delivery, attachments, voice messages, account safety controls, and a prepared voice/video call interface. The repository is the **complete source project**; it does not include generated build outputs, caches, or an APK.

## Product capabilities

| Area | Included behavior |
|---|---|
| Accounts | Registration with display name, globally unique username, email, password confirmation, persistent session, password recovery, sign out, and deletion request flow. |
| Profiles | Avatar upload to Supabase Storage, editable display name/username/bio, dedicated badge row, own-versus-other profile logic, and ownership enforcement. |
| Messaging | Realtime direct and group conversations; message replies, reactions, edits, deletion, copy, unread indicators, images, videos, files, voice recordings, and received-file download/share handling. |
| Groups | Group creation, invitations, member lists, owner/moderator/member roles, backend permission checks, and member removal. |
| Safety | Friend requests, blocks, user reports, message reports, database-side block enforcement for direct messaging, and private moderation records. |
| Notifications | In-app notification feed, friend/group request actions, Android notification channel configuration, and foreground message notification handling. |
| Calls | Voice/video pre-call interface with mute, speaker, video, and hang-up controls. WebRTC/signaling is intentionally not implemented yet. |

## Architecture

The mobile client uses Expo Router and TypeScript. Supabase provides Auth, PostgreSQL, Realtime, and Storage. Every persistent messaging relationship is represented in `supabase/migrations/`; the application client uses only a publishable key and relies on Row Level Security for user isolation.

| Path | Purpose |
|---|---|
| `app/` | Mobile routes and user-interface screens. |
| `components/` | Reusable mobile interface and attachment/voice controls. |
| `lib/` | Supabase client, validation, messaging data access, downloads, and device notification helpers. |
| `providers/` | Authentication and session state provider. |
| `shared/` | Shared conversation, profile, notification, and attachment types. |
| `supabase/migrations/` | Ordered PostgreSQL schema, policies, functions, triggers, and storage configuration. |
| `.github/workflows/android-apk.yml` | Type checks, tests, Android project generation, release APK build, and workflow artifact upload. |

## Required configuration

Follow [Environment Configuration](docs/ENVIRONMENT.md) to add the Supabase project URL and publishable key. The supplied credential smoke test checks the lightweight Supabase Auth settings endpoint. The mobile app must **never** include a service-role key.

## Local development

Install the dependencies and start the Expo development environment:

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

Before exercising registration or messaging, authenticate the Supabase CLI for the intended project and apply the committed migrations:

```bash
supabase link
supabase db push
```

The database must be migrated before the registration trigger, profile policies, storage buckets, realtime tables, and messaging security rules exist.

## Android build

The committed workflow checks out the repository, configures Node.js and JDK 17, restores pnpm and Gradle dependencies, runs the type/test suites, generates the Android project, builds a release APK, and uploads it as a workflow artifact. The workflow uses the official `actions/upload-artifact` action to expose the built file in the run summary.[2]

For local Android generation, run:

```bash
pnpm exec expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleRelease
```

The APK appears under `android/app/build/outputs/apk/release/`. The repository includes the generated **Android Gradle source project** for direct Android development and remote builds. Gradle caches and `build/` outputs remain excluded from source control.

### Optional hosted build profile

`eas.json` supplies development, preview, and production APK profiles. To trigger hosted Expo builds from CI, initialize the project with one interactive build first and add an Expo personal access token as `EXPO_TOKEN`; Expo’s current CI guidance describes these prerequisites for non-interactive builds.[1]

## Security model

> The client provides immediate validation, while the database provides the final enforcement.

Profile edits are restricted to the authenticated profile owner. Usernames use a database unique constraint and case-normalized client validation. Badges cannot be set by ordinary clients. Direct-message sends check active membership and block relationships. Private chat media is visible only to members of its conversation. Group invitation, member removal, and role changes execute through permission-checking database functions.

## Verification

The test suite includes account-field validation, schema-security assertions, and a Supabase public-configuration smoke test. Run all checks with:

```bash
pnpm test
pnpm check
```

## References

[1]: https://docs.expo.dev/build/building-on-ci/ "Expo Documentation: Trigger builds from CI"
[2]: https://docs.github.com/en/actions/tutorials/store-and-share-data "GitHub Docs: Store and share data with workflow artifacts"
