---
schemaVersion: treeseed.knowledge-page/v1
id: vault.provider-credential-rotation
bookId: treeseed-credential-security
slug: provider-credential-rotation
title: Rotating provider credentials
summary: Replace a token at its provider and then encrypt the replacement
  without confusing encryption rotation with credential revocation.
status: published
visibility: team
order: 40
tags:
  - credential
  - token
  - rotation
  - revoke
  - compromise
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.credentials
  - vault.rotation
  - vault.reset
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
  - credential-envelope
actionIds:
  - service.credential.replace
keywords:
  - credential
  - token
  - rotation
  - revoke
  - compromise
documentationUrls: []
---

If a provider credential may be exposed, revoke or rotate it in the provider’s own interface first. Re-encrypting the same value does not invalidate a copied token.

Create a replacement with the minimum required permissions, save it into the matching credential profile, validate it with a read-only lease, and then revoke the old provider credential.

