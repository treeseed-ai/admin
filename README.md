# Cordis Admin


## Task 3B: Installed administration contribution

Legacy src/pages/v1/[...all].ts remains this repository's capability. Native class plugins own /admin, /admin/login, /admin/callback and /admin/logout plus protected status actions and browser-only asset contribution. Identity is consumed through its public contract; platform operations use the SDK invocation contract, never API source. Cookies are Secure, HttpOnly, SameSite and host-only; state/PKCE/nonce and Origin/CSRF checks protect the flow. Browser classes form their own native Cordis root and import no server credentials or Node modules. The initial page reports actual installed readiness, generation and durable application identity.

Task 3B is authorized after the maintainer reviewed the isolated setup. Tracking: #135. Detailed integration plan: https://github.com/treeseed-ai/platform/blob/cordis/docs/superpowers/plans/2026-10-24-task3b-installed-composition.md. Implementation evidence is recorded separately; these requirements are not a passing-test claim.

Development: Bun 1.4.4, Node 24.19.0, TypeScript 5.9.3, native Cordis 4.0.0-rc.12. Run bun run verify (semantic class/source check, strict compiler, build and nonempty unit/integration/program smoke). Installed acceptance uses genuine exact package/OCI bytes, real identity/database/API/HTTPS and explicit isolated certificate trust. No global trust mutation or legacy service changes. All handwritten source, tools and tests are strict TypeScript classes.

All capabilities that can be plugins, including container services, are native Cordis class plugins with typed swappable contracts. No parallel DI graph. Keep independent repository/public package boundaries, exact archive pins and original licenses. Migration PRs target cordis with Part of issue references. All issues remain open until authorized release; installer/Agent/generalized recovery are later tasks.
