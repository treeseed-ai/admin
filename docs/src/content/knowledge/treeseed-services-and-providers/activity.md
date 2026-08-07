---
schemaVersion: treeseed.knowledge-page/v1
id: services.activity
bookId: treeseed-services-and-providers
slug: activity
title: Service activity and validation history
summary: Review connection changes and validation outcomes without exposing
  credential values.
status: published
visibility: team
order: 10
groupIds:
  - activity
  - audit
  - timestamp
  - validation
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.connection
  - services.validation
  - services.settings
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
  - team-service-connection
actionIds:
  - service.activity.read
keywords:
  - activity
  - audit
  - validation
  - timestamp
documentationUrls: []
---

Service activity records security-sensitive metadata such as who connected or edited a provider, which capability changed, and whether read-only validation succeeded.

Times are displayed in your account time zone. Audit payloads contain fingerprints and correlation identifiers, never passphrases, plaintext credentials, derived keys, or decrypted provider responses.

