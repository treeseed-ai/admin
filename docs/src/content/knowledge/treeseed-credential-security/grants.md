---
schemaVersion: treeseed.knowledge-page/v1
id: vault.grants
bookId: treeseed-credential-security
slug: grants
title: Administrator vault grants
summary: Give another administrator cryptographic access without sharing
  passphrases or provider credentials.
status: published
visibility: authenticated
order: 10
tags:
  - grant
  - revoke
  - administrator
  - wrapped team key
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - vault.recovery
  - vault.rotation
  - vault.reset
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
  - team-vault-grant
actionIds: []
keywords:
  - grant
  - revoke
  - administrator
  - wrapped team key
documentationUrls: []
---

Each administrator registers a separate public key and protects their private key with a personal passphrase.

Granting access opens the team vault key only in your browser and wraps it to the recipient’s public key. The recipient never learns your passphrase, and you never learn theirs.

Revoke cryptographic access separately from changing a team role. After removing a credential administrator or suspecting key compromise, rotate the team vault key for the remaining grants.
