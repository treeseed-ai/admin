# @treeseed/admin

`@treeseed/admin` is the distributable AGPLv3 administration portal and independently deployable management site for Treeseed. Its rendered surface includes authentication, account and team management, projects, capacity, agent work, knowledge operations, and service connections.

The removed pre-redesign surface is archived in the root [legacy route inventory](../../docs/legacy-routes.md). The redesign direction is described in [ui-redesign.md](../../docs/ui-redesign.md).

## Run the standalone site

The repository owns a root `treeseed.site.yaml` and can run without Market:

```bash
npm run dev
npm run build:app
npm run preview
```

The app uses the open TreeSeed API through its configured HTTP connection. Runtime content comes from the team-scoped R2 overlay through TreeDX; the site does not require a checked-out content repository. The npm library output remains in `dist`, while the deployable Cloudflare application is built separately under `.treeseed/app-dist`.

## Install and compose as a library

```bash
npm install @treeseed/admin @treeseed/core @treeseed/ui @treeseed/sdk
```

Add `@treeseed/admin/plugin` to another host's `treeseed.site.yaml`, use the config helper from `@treeseed/admin/config`, and delegate host middleware to `@treeseed/admin/middleware`. Market may consume these public package surfaces, but it is not the owner of Admin's standalone deployment.

## Current route surface

- `/app` and focused account routes for Identity, Sessions, Notifications, Appearance, and Delete
- `/app/teams`, team creation, edit, delete, membership, and active-team selection
- registration, verification, sign-in/out, recovery, OAuth callback, username, and device approval
- `/u/[username]` and `/t/[name]` public knowledge profiles with explicit attribution and privacy-safe publication trails
- invitation acceptance and the shared `/v1/[...all]` API facade

`ADMIN_ROUTES` and `ADMIN_SUPPORT_ROUTES` are exported from `@treeseed/admin/routes`, use the SDK route-capability contract, and are tested against the package page tree. Account routes contain only focused controllers and standardized UI-package composition. There are no project, capacity, host, work, knowledge, catalog, seller, commerce, or Markdown-preview routes and no compatibility redirects for them.

Browser mutations use one double-submit CSRF contract at the cookie-to-bearer boundary. Registration checks both permanent username availability and privacy-safe email usability. Provider state/nonce/PKCE, account policy, notifications, personal themes, and deletion cleanup remain API-owned; Admin owns only session glue and focused view models.

## Preserved non-UI contracts

The generic API facade, auth/session integration, middleware, commerce extension contract, and secret-manager contracts remain exported so backend capabilities and future redesign work keep their package boundaries. Admin does not import backend implementation from `@treeseed/api`; runtime behavior stays behind HTTP/proxy surfaces.

Reusable components and styles remain owned by `@treeseed/ui` and were not removed as part of this cleanup. React and email dependencies remain because authentication email flows require them.

## Public exports

- `@treeseed/admin`
- `@treeseed/admin/config`
- `@treeseed/admin/content-config`
- `@treeseed/admin/plugin`
- `@treeseed/admin/routes`
- `@treeseed/admin/middleware`
- `@treeseed/admin/commerce`
- `@treeseed/admin/secret-managers`
- `@treeseed/admin/lib/*`
- `@treeseed/admin/view-models/*`
- retained app/public layouts

## Verification and release

```bash
npm run check
npm test
npm run release:verify
```

`verify.yml`, the manual `release-gate.yml`, and `publish.yml` remain package-owned. Hosted deployment is suspended while the reviewed OpenTofu deployment design is completed; the package must not contain a push-triggered `deploy.yml`.
