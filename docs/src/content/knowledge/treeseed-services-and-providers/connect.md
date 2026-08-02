---
schemaVersion: treeseed.knowledge-page/v1
id: services.connect
bookId: treeseed-services-and-providers
slug: connect
title: Connecting a provider service
summary: Choose a provider account, enable only required capabilities, and
  review credential custody before saving.
status: published
visibility: authenticated
order: 30
tags:
  - connect service
  - provider
  - capability
  - credentials
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.providers
  - services.credentials
  - vault.overview
  - provider.github
  - provider.cloudflare
  - provider.railway
  - provider.openbao
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.services.create
routePatterns:
  - /app/services/new
resourceTypes:
  - team-service-connection
actionIds: []
keywords:
  - connect service
  - provider
  - capability
  - credentials
documentationUrls: []
---

Start with the provider account boundary, then enable the capabilities this team expects to use.

Account IDs, organization names, installation IDs, and workspace IDs are non-secret metadata. Provider tokens, private keys, and other authentication material belong in encrypted credential profiles after the connection exists.

Select only capabilities the team needs. Planned capabilities describe future compatibility but do not prove a deployment or resource mutation exists.
