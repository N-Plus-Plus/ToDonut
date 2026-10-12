# ToDonut integrations

## Dependencies and owners

Supabase browser SDK belongs behind [PersistenceProvider](../src/infrastructure/persistence/persistence.ts); feature screens must not call it directly. Public build configuration uses VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Keep local configuration in ignored .env.local; never use service-role keys, database passwords or tokens in VITE variables. Missing production configuration is an explicit failure, never localStorage fallback.

GitHub Pages/Actions hosts the static build; [Deployment](DEPLOYMENT.md) owns publication. Lucide React uses the locked 0.577.x catalogue for dynamic Quantifier validation, including battery-plus. Reinstall frozen-lockfile dependencies after dependency changes. No email, calendar, Cloudflare or server Cron integration is implied by this suite.

## Auth and redirects

Owner email/password setup is manual in Supabase Authentication > Users; keep public sign-up disabled and confirm email when required. Production owner enrolment, trusted devices and lockout delivery need separately verified project configuration; launch specifications are not implementation evidence.

Supabase Auth URL Configuration must allow the actual app origin, including http://127.0.0.1:5173/ for local testing and the actual Pages URL for production. Recovery hashes with type=recovery are handled before ordinary hash routing; Set Password uses the provider updatePassword path. Never log credential-bearing redirects or session material.

## Failure, retry and time

Normalise provider errors through shared errors/mutation coordination. Transient saves retry within existing bounds; exhausted/conflicted operations remain recoverable and visible. Realtime triggers authoritative reloads, subject to canonical trust and unresolved local work. Ordinary feature handlers must not create parallel provider writes.

Schedules use Australia/Sydney date-only calendar semantics, deterministic occurrence keys and a private generation ledger. Catch-up runs after authenticated trusted startup/reload/focus/visibility and a shared foreground timer. There is no required server midnight job: a closed browser catches up next session. Bakery timers/Proofing use explicit clock and Sydney/DST rules through domain owners, never ad hoc UI time conversions.

## Verification

Mock provider calls for boundary/retry/auth/time tests; no routine vendor availability audit or production writes. Real sign-in, recovery and device acceptance need authorised owner testing. Do not infer provider setup or live execution from configured source.
