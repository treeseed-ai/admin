---
schemaVersion: treeseed.knowledge-page/v1
id: vault.rotation
bookId: treeseed-credential-security
slug: rotation
title: Passphrase, team-key, and provider credential rotation
summary: Choose the rotation that matches the material that may be exposed.
status: published
visibility: authenticated
order: 70
groupIds:
  - rotate-passphrase
  - rotate-team-key
  - rotate-token
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - vault.grants
  - vault.recovery
  - services.credentials
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.services.vault
routePatterns:
  - /app/services/vault
resourceTypes:
  - team-vault
actionIds: []
keywords:
  - rotate passphrase
  - rotate team key
  - rotate token
documentationUrls: []
---

Personal passphrase rotation re-encrypts only your administrator private-key envelope. Provider credentials do not need to be decrypted or rewritten.

Team vault-key rotation rewraps credential keys and remaining administrator grants. Use it after grant revocation or suspected team-key exposure.

Provider credential rotation happens at GitHub, Cloudflare, Railway, or the relevant provider. Re-encrypting a token does not invalidate a token that was already exposed.
