---
schemaVersion: treeseed.knowledge-page/v1
id: services.connection
bookId: treeseed-services-and-providers
slug: connection
title: Service connection administration
summary: Maintain metadata, capabilities, credential readiness, activity,
  validation, and safe disconnection.
status: published
visibility: authenticated
order: 40
groupIds:
  - capabilities
  - connection-settings
  - disconnect
  - validation
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.credentials
  - services.external-vault
  - services.providers
  - services.connections
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
actionIds: []
keywords:
  - connection settings
  - capabilities
  - validation
  - disconnect
documentationUrls: []
---

The connection page separates readable provider metadata from encrypted credential custody.

Changing capabilities does not automatically create provider resources. It records which provider-neutral capability bindings future operations may select.

Read-only validation uses an operation-scoped lease and only the credential fields required by that validation. Disconnection is blocked while another allocation depends on the connection and permanently removes its encrypted credential envelopes when it succeeds.
