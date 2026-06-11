# @treeseed/admin

`@treeseed/admin` is the distributable Treeseed administration portal for organizations. It gives a Treeseed site the authenticated admin surfaces for teams, projects, hosts, work, knowledge, catalog browsing, operational status, and secret-manager workflows.

Use this package when you want a Treeseed-compatible admin portal without taking on the Treeseed market site's public messaging or future ecommerce stack.

## What You Can Build With Admin

- Internal administration portals for teams and projects
- Host and credential management surfaces
- Knowledge and work management screens
- Operational status and deployment control surfaces
- Catalog/profile browsing without payment processing
- Admin integrations that can be layered into a host Treeseed site

Admin is not a UI component library. Reusable layout-down components and styles live in `@treeseed/ui`.

## Install

```bash
npm install @treeseed/admin @treeseed/core @treeseed/ui @treeseed/sdk
```

The host application owns deployment and site configuration. In this workspace, the root `@treeseed/market` app is that host.

## Use In A Treeseed Site

Add the admin plugin to the host site's `treeseed.site.yaml`:

```yaml
plugins:
  - package: "@treeseed/core/plugin-default"
  - package: "@treeseed/admin/plugin"
```

Use the admin Astro config helper from the host app:

```ts
import { defineTreeseedAdminConfig } from '@treeseed/admin/config';

export default defineTreeseedAdminConfig();
```

Delegate middleware from the host app:

```ts
export { onRequest } from '@treeseed/admin/middleware';
```

## Required Host App Setup

The host app must provide:

- one real `treeseed.site.yaml`
- tenant config and environment values
- public content and page overrides
- deployment target and hosting workflow
- API base URL or `/v1/*` proxy path
- any tenant-specific branding or marketplace policy

`@treeseed/admin` does not ship a package-local `treeseed.site.yaml` and does not own hosting.

## Routes And Capabilities

Admin contributes route metadata through:

```ts
import { ADMIN_ROUTES } from '@treeseed/admin/routes';
```

The route set includes admin application pages, auth pages, team invite acceptance, API proxy route metadata, and generic catalog/profile browsing surfaces. Host apps can override Astro pages through their normal Treeseed page override mechanism.

## Auth And Sessions

Admin owns reusable browser auth/session flow, callback handling, account/profile UX integration, and middleware composition. Backend service trust, persistent auth storage, and service credential validation belong in `@treeseed/api`.

Host apps provide deployment-specific secrets and provider settings through their environment registry and secret manager.

## API Connection

Admin reaches backend behavior through API client facades and HTTP/proxy surfaces. It must not import backend implementation from `@treeseed/api`.

In the root market app, `/v1/*` is the web proxy to the API service hosted from `packages/api`.

## Secret Manager Support

Admin owns the user-facing secret-manager experience:

- provider selection
- host credential forms
- unlock/passphrase UX
- linked manager status
- diagnostics views

The public contract is exported from:

```ts
import type { TreeseedSecretManagerProvider } from '@treeseed/admin/secret-managers';
```

Provider mutation, secure read/write adapters, import/adopt/reconcile behavior, and target-specific sync belong in SDK/API primitives.

## Catalog Without Ecommerce

Admin can display free, private, contact, catalog, paid, and subscription offer metadata, but paid/subscription offers are display-only unless a commerce provider is registered.

The extension contract is exported from:

```ts
import type { AdminCommerceProvider } from '@treeseed/admin/commerce';
```

Admin does not implement Stripe, checkout, invoices, subscriptions, coupons, billing, seller payouts, license grants, or commercial support packaging. Those belong in the root market site or a future market-commerce plugin layered above admin.

## Extension Points

Public exports include:

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

Use package exports only. Do not import from `packages/admin/src` in host applications.

## What Admin Does Not Own

- reusable UI primitives or CSS tokens; use `@treeseed/ui`
- generic Astro/Starlight runtime; use `@treeseed/core`
- backend API implementation, PostgreSQL, migrations, or operations runner; use `@treeseed/api`
- capacity provider runtime; use `@treeseed/agent`
- checkout, billing, licensing, seller payouts, or ecommerce policy; use root market/future commerce plugin
- TreeDX repository service internals
- host app deployment manifest

## Verification And Release

Package commands:

```bash
npm install
npm run build
npm run verify:local
npm run release:verify
```

Release integration:

- `treeseed.package.yaml` declares the package repository and release gate.
- `deploy.yml` is the hosted release gate workflow.
- `publish.yml` publishes semver tags to npm.
- GitHub repository credential: `TREESEED_GITHUB_TOKEN_TREESEED_AI_ADMIN`.
- GitHub `production` environment secret: `NPM_TOKEN`.

See the root [Package Ownership](../../docs/package-ownership.md) guide for cross-package boundaries.
