---
schemaVersion: treeseed.knowledge-page/v1
id: services.credentials
bookId: treeseed-services-and-providers
slug: credentials
title: Encrypted provider credentials
summary: Learn what is encrypted, who can use it, and how interactive operations
  receive credentials.
status: published
visibility: authenticated
order: 60
tags:
  - credentials
  - encryption
  - token
  - envelope
  - lease
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - vault.overview
  - vault.grants
  - vault.rotation
  - services.external-vault
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.services.detail
  - admin.services.vault
routePatterns:
  - /app/services/[connectionId]
  - /app/services/vault
resourceTypes:
  - credential-profile
actionIds: []
keywords:
  - credentials
  - encryption
  - token
  - envelope
  - lease
documentationUrls: []
---

Only authentication secrets are encrypted. Searchable account identifiers and labels remain ordinary metadata.

The browser encrypts each sensitive value with associated data binding it to the team, connection, profile, field, purpose, and envelope version. Moving ciphertext to another context makes it unusable.

For an interactive operation, the browser decrypts only required fields and seals them to a short-lived runner key. The runner consumes the lease once, uses plaintext in memory, redacts output, and discards the key material.
