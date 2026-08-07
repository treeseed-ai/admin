---
schemaVersion: treeseed.knowledge-page/v1
id: services.validation
bookId: treeseed-services-and-providers
slug: validation
title: Read-only service validation
summary: Authorize a single-use operation lease that tests a provider connection
  without changing provider resources.
status: published
visibility: team
order: 150
groupIds:
  - credentials
  - lease
  - read-only
  - validation
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.credentials
  - vault.overview
  - services.activity
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.services.detail
routePatterns:
  - /app/services/[connectionId]
resourceTypes:
  - secret-operation-lease
actionIds:
  - service.validate
keywords:
  - validation
  - lease
  - read-only
  - credentials
documentationUrls: []
---

Validation checks that the provider identity, credential, and minimum read permissions work together. It does not create, update, or delete provider resources.

The browser decrypts only the fields named by the operation and seals them to an expiring operations-runner key. The lease is bound to this actor, team, connection, capability, and purpose and can be consumed once.

