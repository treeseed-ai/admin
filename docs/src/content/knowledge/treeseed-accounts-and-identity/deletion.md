---
schemaVersion: treeseed.knowledge-page/v1
id: account.deletion
bookId: treeseed-accounts-and-identity
slug: deletion
title: Permanently deleting an account
summary: Understand blockers, reauthentication, confirmation, and the access
  removed by deletion.
status: published
visibility: authenticated
order: 30
groupIds:
  - blockers
  - delete-account
  - irreversible
  - reauthentication
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - account.security
  - account.sessions
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.account.delete
routePatterns:
  - /app/account/delete
resourceTypes:
  - account
actionIds: []
keywords:
  - delete account
  - blockers
  - reauthentication
  - irreversible
documentationUrls: []
---

Account deletion is irreversible. It signs out every device and removes the account data allowed by retention and audit policy.

TreeSeed checks for responsibilities that would be orphaned, such as sole team ownership. Resolve every blocker before trying again.

Deletion requires recent reauthentication and the exact confirmation phrase shown in the form. A failed confirmation or password check must leave the account unchanged.
