# Changelog

## [0.12.49] - 2026-07-13

### Dependencies

- build(deps): pin @treeseed/core and @treeseed/sdk to git commits (d34df6edbde0)

## [0.12.48] - 2026-07-12

### Dependencies

- build(deps): update @treeseed/core and @treeseed/sdk to git pointers (9e1d9a71227d)

## [0.12.47] - 2026-07-12

### Dependencies

- build(deps): point @treeseed/core and @treeseed/sdk to git sources (ee1f2242c974)

## [0.12.46] - 2026-07-12

### Dependencies

- build(deps): update dependencies and version (9031fd09ab8a)

## [0.12.45] - 2026-07-12

### Dependencies

- build(deps): update @treeseed/core and @treeseed/sdk to git pointers (91caacc70020)

## [0.12.44] - 2026-07-12

### Dependencies

- build(build): preserve registry dependency lock semantics (58747b4b63f0)

## [0.12.43] - 2026-07-12

### Dependencies

- build(build): reuse exact staged candidate proof during release (e92654116963)
- build(build): reuse staged package closure during release verification (c828fb433172)
- build(build): resolve managed release tooling and stale checkout (e1d0c5f3881c)

## [0.12.42] - 2026-07-12

### Tests

- build(build): verify local-only reviewer through workspace links (792f12314fa2)

### Dependencies

- build(build): allow Railway deployments to settle before live (4f557c98f00b)
- build(build): restore workspace links after release dependency hydration (ade03f00c783)
- build(build): hydrate missing package dependencies before release (91cf41a4558e)
- build(build): avoid release tag collisions after partial publication (a7b14dcb3482)
- build(build): sync package dependency references (31adca31ce83)
- build(admin): bump version and update dependencies (b1c86b517d33)
- build(deps): update @treeseed/sdk and @treeseed/core git references (274efabdf23c)
- build(deps): update @treeseed/core and @treeseed/sdk commit hashes (3493819a66da)
- build(deps): update package version and dependency pointers (d29f1ba19c3a)

## [0.12.41] - 2026-07-11

### Added

- feat(config): use deterministic seeded project IDs in scenes (85c619debe32)
- feat(config): fix hosted scene fixtures routes and browsers (fba3361fcd02)
- feat(config): assert stable verification handoff heading (cffbe559838c)
- feat(config): separate hosted email UI and delivery evidence (c6cb3d9acccd)
- feat(ui): Bind hosted API SMTP settings from root staging registry (9561c4cba5c5)
- feat(config): Repair staging guarantee scenes and retain scene evidence (01f3b71e67ef)
- feat(config): Fix staging guarantee scene routes and registration (b7b3aeba7824)

### Fixed

- build(build): fix stage completion and API SMTP routing (2e477991efc6)
- build(build): Bind hosted API SMTP settings from root staging registry (58640c155db2)
- build(build): fix staging candidate credential handoff (cbd89bfbdc6e)
- build(ui): lock in UI shell architecture and test fixes (93068402f79d)

### Tests

- ci(build): Standardize verify release-gate and deploy workflows (fec0d7dcba9e)
- ci(ci): recover reliable save stage release workflow (f50761996ea3)

### Dependencies

- build(build): Exclude verification-only packages from release (1b2868ce2a43)
- build(build): seed verified login fixture without browser session (5e086b49f23a)
- build(build): preserve dependency graph during artifact hydration (618c668b443c)
- build(build): hydrate exact candidate artifacts before staging deploy (2ace7555911a)
- build(build): Propagate API web service secret through staging (16fcf315da5e)
- build(build): Propagate control-plane secrets through staging (64d86ce64dbc)
- build(build): Expose API surface URLs to strict live staging checks (8b9194b2bc54)
- build(build): Make hosted apply wait for transient HTTP readiness (a5e1342f2997)
- build(build): inject protected TreeDX secrets into staging (6641abfdc0a4)
- build(build): make staging candidate retries resumable (416a05cf64bd)
- build(build): release guarantee reviewer and coverage updates (08abbb4ecb26)
- build(build): release guarantee reviewer and coverage updates (976041949d98)
- build(build): release guarantee reviewer and coverage updates (983e7aadcc1e)
- build(config): release guarantee reviewer and coverage updates (c4d563cdfa95)
- build(build): guard API workflow entrypoints and staging fanout (f659b8fa5ced)
- build(build): block dependents on API deploy workflow (bff31a852f10)
- build(build): sync package dependency references (13e7ee9d460f)

## [0.12.40] - 2026-07-06

### Changed

- Release metadata and deployment history updated.

## [0.12.39] - 2026-07-06

### Dependencies

- build(build): sync starter and fixture submodule promotion with stage (718dbd5efc70)

## [0.12.38] - 2026-07-06

### Fixed

- build(build): fix Railway Dockerfile hosted build command verification (6e1aeeeabbad)

### Dependencies

- build(build): complete starter, api guarantee, and agent live (9c8af76ff839)
- build(docs): complete starter, api guarantee, and agent live (81198b7d70b6)

## [0.12.37] - 2026-07-05

### Changed

- Release metadata and deployment history updated.

## [0.12.36] - 2026-07-05

### Dependencies

- build(build): add final production release guarantee gate (d9793e1cf239)

## [0.12.35] - 2026-07-05

### Fixed

- build(build): fix production source cache purge finalization (40ac2da59fae)

## [0.12.34] - 2026-07-04

### Dependencies

- build(build): bypass source page edge cache for production release (b8e3bcfe5ffa)
- build(build): make live hosted env checks provider authoritative (8e8d82c637a2)
- build(build): fail release on broken production web surface (9223d0442053)

## [0.12.33] - 2026-07-04

### Dependencies

- build(build): purge production web cache before release verification (b370857e848d)
- build(build): purge production web cache before release verification (6d8e60646ac3)

## [0.12.32] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.31] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.30] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.29] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.28] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.27] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.26] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.25] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.24] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.23] - 2026-07-04

### Changed

- Release metadata and deployment history updated.

## [0.12.22] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.21] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.20] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.19] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.18] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.17] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.16] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.15] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.14] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.13] - 2026-07-03

### Changed

- Release metadata and deployment history updated.

## [0.12.12] - 2026-07-02

### Changed

- Release metadata and deployment history updated.

## [0.12.11] - 2026-07-02

### Changed

- Release metadata and deployment history updated.

## [0.12.10] - 2026-07-02

### Fixed

- fix(release): advance staging sdk lock recovery ref (d5d162512170)
- fix(release): advance staging sdk ref (beeefab1ad18)
- fix(release): advance staging sdk verification ref (a35a92b4e49e)
- fix(release): advance staging sdk reference (b6dc2d0fe8e0)
- fix(release): restore staging dependency refs (5bf40a6ed08e)

## [0.12.9] - 2026-07-02

### Fixed

- fix(release): restore staging dependency refs (10efa3b030cf)

## [0.12.8] - 2026-07-02

### Fixed

- fix(release): refresh staging package refs (c64992398cd8)
- fix(release): use staging package commit refs (05e11ed11560)

## [0.12.7] - 2026-07-02

### Changed

- Release metadata and deployment history updated.

## [0.12.6] - 2026-07-02

### Changed

- Release metadata and deployment history updated.

## [0.12.5] - 2026-07-02

### Changed

- Release metadata and deployment history updated.

## [0.12.4] - 2026-07-02

### Fixed

- fix(release): publish plain semver tags (5c995e13c5ad)

## [0.12.3] - 2026-07-02

### Changed

- Release metadata and deployment history updated.

## [0.12.2] - 2026-07-01

### Changed

- Release metadata and deployment history updated.

## [0.12.1] - 2026-07-01

### Changed

- Release metadata and deployment history updated.

## [0.12.0] - 2026-07-01

### Fixed

- build(build): fix image release root directory verification (b01f8910e10a)
- build(build): fix Railway runtime config verification (551bc0557e67)
- build(build): fix release guarantee API verifiers (6f2c60be1cf7)
- build(config): fix staging release guarantee auth (c93898999d59)
- build(build): fix production release gates (cad506bbc2ab)
- build(build): promotion proof after CI and acceptance fixes (ce30b9dfab74)
- build(build): fix SDK proof regressions after guarantee framework (69472ebb8d52)
- build(build): fix proof tests for clean hosted runners (3c895b5b0b32)
- build(build): fix core hosted proof railway dependency lock (1d6b3f98cdfd)
- build(build): fix promotion release gate assertions (7d0f155f1ca6)
- build(build): fix TreeDX release gate Beam setup (9dfdd1844ef9)
- build(build): fix scoped project domains for staging Pages (57ad4b7d1b33)
- build(build): fix Railway deploy live verification settle window (637567211483)
- build(build): fix Agent capacity provider Docker build shape test (0e356991d993)
- build(build): fix staging hosted service credential and Railway source (db3640661776)
- build(build): fix Railway IaC-only reconciliation and TreeDX env names (d57441973f21)
- ci(build): fix Railway staging Dockerfile builds and persistent volumes (251082d7846f)
- build(build): fix staging Railway source builds and volumes (17f1d2393af5)
- build(build): fix API staging source builds and runner volumes (4f0deac72512)
- build(build): fix api and agent staging source builds (146ace4ee00e)
- 17 additional changes omitted from this summary.

### Tests

- build(build): checkpoint before verify action and local dev stack (ba6fa8067823)
- build(build): prepare linked runtime deps during core release verify (75d05379dcb1)

### Dependencies

- build(build): allow first production API domain validation (64f2d3a05929)
- build(build): merge package main history back to staging (c40bc0cdf336)
- build(config): checkpoint user and team guarantees passing locally (9ff7ba65a08a)
- build(build): replace legacy strict tail with proof ledger (b806ee2ad2ac)
- build(build): implement incremental release proof (73d99b40c81a)
- build(build): pin hosted workflow API domains to treeseed.dev (6023f55d5bd9)
- build(build): use configured API domains for hosted reconciliation (3587dcc1761c)
- build(build): include domain units in promotion hosted reconciliation (de4f4959e619)
- build(build): switch hosted domains to treeseed.dev (4aad52b9f97e)
- build(build): harden Railway IaC reconciliation and domain verification (2e44fda4be56)
- build(build): repair managed worktree cleanup after docker verification (8b4ed4abc458)
- build(build): finish staging workflow hardening checkpoint (6d8a499d78b0)
- build(build): exclude build artifacts from stage proof workspace (f6cabb124027)
- build(build): update stage command help text (318c1cb62c21)
- build(build): rework stage promotion workflow (da46c308c4ad)
- build(build): use image-backed Railway API staging services (45ffad56c937)
- build(build): skip opaque railway sync provider errors after retries (ddc296d479b6)
- build(build): tolerate railway deploy trigger processing errors (89dc1ee94139)
- build(build): retry transient railway hosted sync failures (96d557991739)
- build(build): tolerate railway existing service source update limits (3dce8ca55daa)
- 21 additional changes omitted from this summary.

## [0.11.0] - 2026-06-12

### Fixed

- fix: remove api peer from admin package release (8c5e8708d670)

### Tests

- test: align admin plugin package test with sdk hooks (c04d55c2a338)
- ci(build): stage package submodule restructuring (93228154489d)
- build(build): stage package submodule restructuring (c07bf17f203b)
- ci(ui): stage package submodule restructuring (08e82a6a5e90)

### Dependencies

- build(build): stage package submodule restructuring (504615564c42)
- build(build): stage package submodule restructuring (6ecb560a5c00)
- build(build): stage package submodule restructuring (a135a1da0a40)
- build(build): stage package submodule restructuring (8cd771e031d3)
- Release @treeseed/admin 0.11.0.
