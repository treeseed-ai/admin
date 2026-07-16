# @treeseed/admin

`@treeseed/admin` is the distributable AGPLv3 identity and team administration layer for Treeseed sites. During preparation for the comprehensive UI redesign, its rendered surface is intentionally limited to authentication, account management, team management, active-team selection, invitations, and public user/team identity profiles.

The removed pre-redesign surface is archived in the root [legacy route inventory](../../docs/legacy-routes.md). The redesign direction is described in [ui-redesign.md](../../docs/ui-redesign.md).

## Install and compose

```bash
npm install @treeseed/admin @treeseed/core @treeseed/ui @treeseed/sdk
```

Add `@treeseed/admin/plugin` to the host `treeseed.site.yaml`, use the config helper from `@treeseed/admin/config`, and delegate host middleware to `@treeseed/admin/middleware`. Admin does not own a hostable site manifest; the host app owns deployment and environment configuration.

## Current route surface

- `/app` and `/app/account`
- `/app/teams`, team creation, edit, delete, membership, and active-team selection
- registration, verification, sign-in/out, recovery, OAuth callback, username, and device approval
- `/u/[username]` and `/t/[name]` identity-only public profiles
- invitation acceptance and the shared `/v1/[...all]` API facade

`ADMIN_ROUTES` is exported from `@treeseed/admin/routes` and is tested against the package page tree. There are no project, capacity, host, work, knowledge, catalog, seller, commerce, or Markdown-preview routes and no compatibility redirects for them.

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

`verify.yml`, the manual `release-gate.yml`, and `publish.yml` remain package-owned. Hosted deployment is suspended; the package must not contain a push-triggered `deploy.yml`.
