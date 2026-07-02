# Changelog

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
