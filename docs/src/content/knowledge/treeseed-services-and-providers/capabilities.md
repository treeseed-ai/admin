---
schemaVersion: treeseed.knowledge-page/v1
id: services.capabilities
bookId: treeseed-services-and-providers
slug: capabilities
title: Service capability bindings
summary: Enable provider-neutral capabilities independently and make them
  available to future project and capacity workflows.
status: published
visibility: team
order: 20
groupIds:
  - binding
  - capability
  - hosting
  - repository
  - workflow
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.connection
  - services.providers
  - services.credentials
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.services.create
  - admin.services.detail
routePatterns:
  - /app/services/new
  - /app/services/[connectionId]
resourceTypes:
  - service-capability-binding
actionIds:
  - service.capability.enable
  - service.capability.disable
keywords:
  - capability
  - binding
  - repository
  - workflow
  - hosting
documentationUrls: []
---

A connection represents one provider account boundary. Capability bindings describe the separate jobs that connection may perform.

Enable only the capabilities the team needs. Repository hosting, workflow execution, secret enclaves, frontend hosting, backend hosting, DNS, and other capabilities remain distinct even when one provider supplies several.

