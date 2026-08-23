# Chat Environment Configuration

Chat reads two **public, Android-safe** environment values at build time. Add them through the project’s secure environment settings for local development and configure the same names as repository secrets for the Android build workflow. They are public client configuration values, not privileged credentials.

| Variable | Required value | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | The HTTPS URL of the Supabase project, such as `https://project-ref.supabase.co`. | Selects the Supabase Auth, Database, Realtime, and Storage project used by the application. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The Supabase publishable/anon key for the same project. | Authenticates client requests within the Row Level Security policies supplied in `supabase/migrations/`. |

> **Never add `SUPABASE_SERVICE_ROLE_KEY` or any service-role credential to this mobile project or to GitHub Actions.** Administrative access belongs only in trusted server-side operations.

## Applying the schema

The Supabase migrations are deliberately ordered and must be applied as a sequence. Use a Supabase CLI session authenticated to the intended project, then run `supabase link` and `supabase db push` from the repository root. The profile trigger and all Row Level Security policies are created by these migrations; registration should not be tested until the migration run succeeds.

## GitHub Actions secrets

Open the repository’s **Settings → Secrets and variables → Actions** page and add the two public variables under the same names. The workflow injects them only for dependency validation and Android generation. It never requests or exposes a service-role key.
