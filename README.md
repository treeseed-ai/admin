# Cordis Admin

## Task 3D owner compatibility

Issue #150 qualifies Admin .12 and aligns existing Admin behavior with the exact public owner candidates below.
Keycloak identity, session authority and reusable mobile-first UI remain owned by their existing
packages. This compatibility slice adds no browser application or Agent execution authority.

| Owner | Version | Source | Archive SHA-256 |
| --- | --- | --- | --- |
| SDK | `0.0.0-cordis.42` | `afdfac7bdd3c9c1f783362cd1d50324181e1d725` | `0ecfe599916fe8ef364fc4b73203c810981f163109fbe71a0dd4c01a9dfb7bbc` |
| Identity | `0.0.0-cordis.9` | `c60dfdbc53ce78ddee3c2f18ec7f91358878d49c` | `2999a78da5c04f6a894c643d49ab3881ff702fb4325d74fec469a4496f034c67` |
| UI | `0.0.0-cordis.23` | `d5d33c33791fe8b94aada605dba4aa9392559637` | `7291d35fe8758fd27b23f663dcf1f254bd915b5ae3569dde8c9a2f443e45a14f` |

The built public compatibility program requires manager channel 1.1.0-cordis.1 and preserves
all seven global operations. Peer pins, installed packages and accepted archives must agree. Historical artifacts stay
immutable. Full Task 3D runtime acceptance and productive Work/model execution are separate;
the latter remains Task 10. All issues remain open until authorized release.


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

The current Task 3C dependency candidate aligns SDK `.12`, Identity `.4` and UI `.14` through exact
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

The selected-endpoint continuation adopts Identity `.4` from
`d837d23d99bc49eb1954bdd865397d34186d41a1`, archive SHA-256
`0e377e4a0ad79ee649b20e41779c862e431f20979b19cae638b658925686d9f1`.
This removes the inherited fixed internal identity name/port in the owning adapter. Admin
continues to consume Identity's native session contract and UI `.14` public renderers; it does
not take ownership of OIDC or introduce another authority. Rebuild and qualify the browser
asset/package identity together. Genuine installed Keycloak acceptance remains in the API and
Platform assembled gates; authority fixtures in this repository are still explicitly fixtures.

The adoption smoke checks installed SDK/UI/Identity versions against exact peer selections and
vendored archive hashes before accepting the candidate. Changed local tarball specifiers require
a forced fresh install; changing a cache directory alone can leave previous installed bytes.
The corrected Admin `.6` candidate is rebuilt and reverified after that read-back. Older private
candidate receipts remain historical; they do not stand in for this installed dependency check.

### Node package-boundary asset resolution

The default asset catalog must resolve every dependency to its matching named npm package
root. A nested `package.json` that only declares module mode is not a package identity; Node
may legitimately resolve a CommonJS export beneath that boundary (including Postgres).
Keep package names, versions, complete dependency traversal and asset-byte checks authoritative.
The built Node default-construction smoke runs with genuine installed dependencies, without
substituting an asset provider or requiring database or identity services.

### Status invocation contract

Admin's domain adapter consumes the SDK `platform.status` operation's parsed output directly.
The API's authenticated machine endpoint and native invoker return that raw output; CLI command
envelopes are a separate transport convention. Validate both supported status formats through
`PlatformOperations.status.parseOutput` before mapping UI models. The browser authority fixture
must return a genuine SDK-valid status, not an invented envelope or service identifier. Preserve
escaping coverage through valid installation text and reject malformed status/extra envelopes.

### Shared mobile-first candidate alignment

Admin `.9` selects SDK `.14` (source `597a9abd79b76fb292a80cd86e4ea83042fbec62`),
UI `.15` (`25856122398e44e2f8fd973a396ce46b3a585400`) and Identity `.5`
(`65bfe5256e92da15372a8a174e5e47f974a3ef45`). The exact vendor hashes and installed
versions must match package metadata before browser qualification. These selections retain
UI-owned pure React class components and mobile-first 320–2560-pixel layouts, and
Identity-owned Keycloak sessions; Admin owns only its domain models and actions. No identity
or presentation implementation moves between repositories. The owner adoption smoke must
explicitly require these versions, so stale coherent selections cannot pass by agreeing
with their own outdated manifest.

### Coherent Task 3C owner alignment

Admin's next candidate consumes exact SDK `.16`, Identity `.7` and reusable UI `.16` through
public owner archives, with a fresh installation and installed-version/hash read-back. SDK source
is `4c0ecd2a0fc28545dbf677cc988ce69f0cf2f15d`; Identity source is
`f29824578d0aa8fc7725a195b72c698b476da429`; UI source is
`32f16876aa6f0eb1f99a4ab339296609c830df23`. Exact archive digests remain in package metadata.
Rebuild browser assets from that one peer closure; preserve Identity-owned Keycloak/session
policy and UI-owned rendering. Owner browser tests retain their explicit fixture identity authority;
final API/Platform assembly must separately qualify the genuine installed Keycloak flow.

The initially selected Identity .6 archive was rejected by this consumer because its native declaration still reported .5. Use corrected .7 with its new executable packaging guard; the rejected immutable archive is not consumed.
