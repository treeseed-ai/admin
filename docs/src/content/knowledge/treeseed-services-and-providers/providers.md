---
schemaVersion: treeseed.knowledge-page/v1
id: services.providers
bookId: treeseed-services-and-providers
slug: providers
title: Provider capabilities and permission boundaries
summary: Compare supported providers without treating shared capability types as
  shared credentials.
status: published
visibility: authenticated
order: 130
tags:
  - github
  - cloudflare
  - railway
  - openbao
  - permissions
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - provider.github
  - provider.cloudflare
  - provider.railway
  - provider.openbao
  - services.credentials
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.services.collection
  - admin.services.create
  - admin.services.detail
routePatterns:
  - /app/services
  - /app/services/new
  - /app/services/[connectionId]
resourceTypes:
  - service-provider
actionIds: []
keywords:
  - github
  - cloudflare
  - railway
  - openbao
  - permissions
documentationUrls: []
---

Provider connections are modular. Different providers may become eligible for the same capability while retaining different account models, permission limits, and credential profiles.

Prefer the narrowest provider identity and credential scope available. Split credentials by capability when the provider supports that separation. When a provider exposes one broad token, use a dedicated account or workspace to reduce its blast radius.
