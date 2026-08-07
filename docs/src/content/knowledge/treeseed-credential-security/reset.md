---
schemaVersion: treeseed.knowledge-page/v1
id: vault.reset
bookId: treeseed-credential-security
slug: reset
title: Destructive vault reset
summary: Permanently discard inaccessible encrypted credentials and initialize
  replacement custody.
status: published
visibility: authenticated
order: 60
groupIds:
  - discard-credentials
  - irreversible
  - reauthentication
  - reset-vault
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - vault.recovery
  - vault.grants
  - vault.rotation
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
  - reset vault
  - discard credentials
  - irreversible
  - reauthentication
documentationUrls: []
---

Reset is only for the case where no usable administrator grant remains.

The operation permanently discards protected provider credential envelopes. It cannot recover, reveal, or migrate their plaintext values. Every credential must be recreated or reentered afterward.

Reset requires owner authorization, recent account reauthentication, your personal vault passphrase for the replacement grant, and the exact confirmation text shown by the form.
