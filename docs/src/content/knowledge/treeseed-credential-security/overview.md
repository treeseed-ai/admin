---
schemaVersion: treeseed.knowledge-page/v1
id: vault.overview
bookId: treeseed-credential-security
slug: overview
title: How the service vault works
summary: Understand personal keys, team custody, encrypted credentials, and the
  boundary TreeSeed cannot cross.
status: published
visibility: authenticated
order: 20
groupIds:
  - encryption
  - passphrase
  - service-vault
  - team-key
  - zero-knowledge
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - vault.personal-key
  - vault.team-custody
  - vault.recovery
  - vault.grants
  - vault.rotation
  - vault.reset
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
  - service vault
  - passphrase
  - encryption
  - team key
  - zero knowledge
documentationUrls: []
---

The service vault protects provider credentials without giving the TreeSeed API a general decryption path.

Your personal passphrase encrypts your administrator private key in the browser. A separate random team vault key wraps credential keys and is independently granted to authorized administrators.

TreeSeed stores public keys, ciphertext, wrapped keys, salts, nonces, versions, and fingerprints. It never retains passphrases, plaintext provider tokens, derived keys, unlocked private keys, or decryptable team keys.

Unlocking is temporary and in-memory. Signing out or reaching the inactivity limit locks the browser controller.
