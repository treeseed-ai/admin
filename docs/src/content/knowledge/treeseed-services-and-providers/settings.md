---
schemaVersion: treeseed.knowledge-page/v1
id: services.settings
bookId: treeseed-services-and-providers
slug: settings
title: Service connection settings
summary: Change readable account metadata and enabled capabilities without
  exposing or replacing encrypted credentials.
status: published
visibility: team
order: 140
groupIds:
  - account-id
  - metadata
  - organization
  - settings
  - workspace
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.connection
  - services.capabilities
  - services.disconnection
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
  - service.connection.update
keywords:
  - settings
  - metadata
  - account id
  - workspace
  - organization
documentationUrls: []
---

Connection settings contain non-secret identifiers and labels administrators need to recognize and route the provider account. They are stored as searchable metadata.

Credential profiles are managed separately. Updating a connection name, organization, account ID, or workspace ID never decrypts a credential envelope.

