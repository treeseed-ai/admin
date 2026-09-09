# @treeseed/admin

TreeSeed's independently deployable administration application and reusable route package. Admin manages teams, projects, capacity, AI, work, knowledge, service connections, and application profiles. Market remains independently built and deployed.

## Build and run

```bash
npm ci
npm run dev
npm run build:app
npm run build:pages
npm run release:verify
```

The Node and Cloudflare applications use the same package-owned Identity integration. The npm library is emitted under `dist`; the hosted application is emitted under `.treeseed/app-dist`.

## Identity configuration

Deployment supplies these runtime settings, separately from source configuration:

| Setting | Purpose |
| --- | --- |
| `TREESEED_SITE_URL` | This application's HTTPS origin |
| `TREESEED_API_BASE_URL` | The exact HTTPS API resource |
| `TREESEED_IDENTITY_ISSUER` | The explicitly selected, API-advertised issuer |
| `TREESEED_IDENTITY_ACCOUNT_URL` | That authority's HTTPS account-management page |
| `TREESEED_IDENTITY_WORKLOAD_CLIENT_ID` | This application's independent workload client |
| `TREESEED_IDENTITY_WORKLOAD_PRIVATE_KEY` | Protected PKCS8 asymmetric workload key, never browser configuration |

The API must register the application's browser client and exact `/auth/callback` redirect, and authorize its workload client for the SDK's browser-session bridge scope and permission. The browser and workload clients are distinct. Production must not select this artifact before the coordinated API, Identity, database, and Deployment migration passes.

Sign-in redirects to Identity; Admin never collects a login password, issues access tokens, or stores refresh tokens in browser cookies. The shared Identity adapter sends opaque, host-only, Secure/HttpOnly application handles to the browser. API stores encrypted one-use PKCE transactions and session credentials. Resource-bound access tokens exist only on the server and are never serialized into Astro locals.

Profile and contact-email changes remain API-owned application operations. Confirming a contact email does not link sign-in identities or grant team membership. Passwords, MFA, and recovery are managed at the configured Identity account page. App logout revokes this application session; it does not silently terminate other applications' identity sessions.

Applications need independent browser clients, workload clients, and cookies. Never copy these credentials to another Market API or forward one resource's bearer token to another. There is no fallback to legacy password, shared-secret assertion, or access-token-cookie authentication.

## Composition

Install `@treeseed/admin`, `@treeseed/core`, `@treeseed/ui`, and `@treeseed/sdk`; add `@treeseed/admin/plugin` to the host site declaration and delegate middleware to `@treeseed/admin/middleware`. Public exports are authoritative in `package.json`. Reusable forms and account components belong to UI; backend access remains HTTP through the configured API, not imported API implementation.

## Acceptance ownership

Admin retains application sign-in/callback/logout and contact-email scenarios. Registration and password recovery belong to Identity and its managed Deployment acceptance, not duplicate Admin forms. The login scene requires a disposable Identity account and explicit API principal mapping; its fixture password is test-only. Unit contracts are not a substitute for that managed browser acceptance.

Changes ship through Issues, PRs, Actions, staging candidates, and exact Platform composition. Human review is reserved for production PRs to `main`. Rollback requires a coordinated application/database restore point; never run an old authentication writer against migrated data.
