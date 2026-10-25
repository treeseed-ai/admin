# Cordis Admin


## Task 3B: Installed administration contribution

Legacy src/pages/v1/[...all].ts remains this repository's capability. Native class plugins own /admin, /admin/login, /admin/callback and /admin/logout plus protected status actions and browser-only asset contribution. Identity is consumed through its public contract; platform operations use the SDK invocation contract, never API source. Cookies are Secure, HttpOnly, SameSite and host-only; state/PKCE/nonce and Origin/CSRF checks protect the flow. Browser classes form their own native Cordis root and import no server credentials or Node modules. The initial page reports actual installed readiness, generation and durable application identity.

Task 3B is authorized after the maintainer reviewed the isolated setup. Tracking: #135. Detailed integration plan: https://github.com/treeseed-ai/platform/blob/cordis/docs/superpowers/plans/2026-10-24-task3b-installed-composition.md. Implementation evidence is recorded separately; these requirements are not a passing-test claim.

Development: Bun 1.4.4, Node 24.19.0, TypeScript 5.9.3, native Cordis 4.0.0-rc.12. Run bun run verify (semantic class/source check, strict compiler, build and nonempty unit/integration/program smoke). Installed acceptance uses genuine exact package/OCI bytes, real identity/database/API/HTTPS and explicit isolated certificate trust. No global trust mutation or legacy service changes. All handwritten source, tools and tests are strict TypeScript classes.

All capabilities that can be plugins, including container services, are native Cordis class plugins with typed swappable contracts. No parallel DI graph. Keep independent repository/public package boundaries, exact archive pins and original licenses. Migration PRs target cordis with Part of issue references. All issues remain open until authorized release; installer/Agent/generalized recovery are later tasks.

## Task 3C contract

Owner issue: https://github.com/treeseed-ai/admin/issues/137. Follow the approved Platform Task 3C service/provider/UI plan through exact public archives. Preserve independent repository ownership, strict TypeScript classes, native Cordis lifecycle, historical formats and all seven SDK operations. Expected-generation/idempotency, resource/credential/TLS retention and explicit unsafe restart/migration gates are mandatory. All issues remain open until release.

Every visual component must be mobile-first from 320 CSS pixels to widescreen monitors; test 320/375/768/1024/1440/1920/2560 widths, long content, keyboard/touch and 200% text resizing. Keep authored controls at least 44×44 CSS pixels, required actions visible, logical/fluid dimensions and no page overflow (labeled local semantic-table overflow is permitted). UI owns components/styles/renderers; consumers retain domain behavior and Identity retains Keycloak authority.

## Reusable UI presentation boundary

Admin maps installed status and sign-out into validated UI stack/status/table/form models.
UI owns the complete mobile-first document, controls, styles, inert bootstrap and browser
hydration. Admin owns its routes, same-origin status/logout request adapters, cookie/session
boundaries and navigation. Keycloak login/callback/PKCE and issuer/session authority remain
in Identity. No bearer tokens, session cookies or client secrets enter browser/bootstrap data.

The sign-out action carries only its public session-bound anti-CSRF nonce through typed
`actionData`; the existing server origin/nonce checks remain authoritative. Browser status
uses the existing authenticated `/admin/status` interface. Immutable browser/style assets
are served from verified owner bytes under the same-origin CSP, including `style-src 'self'`.
Native route/browser adapters remain swappable class providers. UI artifacts and all runtime
peers are selected by exact public package archives; no owner source import is introduced.
### Exact owner artifact adoption

The current Task 3C dependency candidate aligns SDK `.12`, Identity `.3` and UI `.14` through exact
vendored public archives and peer pins. Admin constructs domain view models and delegates human
rendering to UI providers. Native session/route and browser-only asset checks remain required;
dependency qualification alone does not establish the genuine Keycloak installed assembly gate.

Browser qualification uses exact Playwright 1.64.1 and a fresh Firefox/NSS profile with explicit
fixture certificate trust. Ubuntu 26.04 CI installs visible prerequisites; no global trust
change or ignored TLS failure is part of the acceptance gate.

`GET /admin/presentation` is a session-protected, no-store human-interface bootstrap adapter
returning only the accepted public asset generation. The browser compares it through UI's
hydration contract before admitting actions. The server verifies its complete installed public
asset closure (package identity, path, bytes and digest), serves immutable same-origin assets,
and refuses a configured asset generation that differs from those actual bytes. Status refresh
uses the existing protected endpoint; logout drains UI actions before navigating to Keycloak's
existing login flow. These adapters add no installer or machine-operation endpoint.
