---
schemaVersion: treeseed.knowledge-page/v1
id: services.disconnection
bookId: treeseed-services-and-providers
slug: disconnection
title: Disconnecting a service
summary: Resolve capability consumers before removing a connection and its
  encrypted credential records.
status: published
visibility: team
order: 70
tags:
  - disconnect
  - delete
  - blocker
  - ciphertext
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.settings
  - services.capabilities
  - vault.reset
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
  - service.connection.disconnect
keywords:
  - disconnect
  - delete
  - blocker
  - ciphertext
documentationUrls: []
---

Disconnecting removes TreeSeed’s connection metadata, capability bindings, credential profiles, encrypted envelopes, and related run-owned leases. It does not delete anything at the provider.

The operation is blocked while another platform resource references the connection. Resolve every dependency before confirming disconnection.

