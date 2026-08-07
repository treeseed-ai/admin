---
schemaVersion: treeseed.knowledge-page/v1
id: services.connections
bookId: treeseed-services-and-providers
slug: connections
title: Connected provider services
summary: Understand provider connections, capability bindings, custody
  readiness, and active-team scope.
status: published
visibility: authenticated
order: 50
groupIds:
  - active-team
  - capabilities
  - connections
  - providers
  - services
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.connect
  - services.connection
  - services.credentials
  - services.providers
  - vault.overview
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.services.collection
routePatterns:
  - /app/services
resourceTypes:
  - team-service-connection
actionIds: []
keywords:
  - services
  - providers
  - connections
  - capabilities
  - active team
documentationUrls: []
---

A service connection represents a provider account boundary such as a GitHub organization, Cloudflare account, or Railway workspace.

Connections belong to the active team. Switching teams immediately changes the collection and never exposes another team’s encrypted envelopes.

Capabilities are enabled independently. A provider may support repository hosting, workflow execution, secret enclaves, frontend hosting, or other purposes without making those purposes interchangeable.
