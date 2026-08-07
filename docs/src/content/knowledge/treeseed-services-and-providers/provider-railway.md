---
schemaVersion: treeseed.knowledge-page/v1
id: provider.railway
bookId: treeseed-services-and-providers
slug: provider-railway
title: Connecting Railway safely
summary: Record a workspace boundary and acknowledge the broader authority of
  shared Railway tokens.
status: published
visibility: authenticated
order: 120
groupIds:
  - api-token
  - blast-radius
  - railway
  - workspace
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.connect
  - services.providers
  - services.credentials
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds: []
routePatterns: []
resourceTypes: []
actionIds: []
keywords:
  - railway
  - workspace
  - api token
  - blast radius
documentationUrls:
  - https://docs.railway.com/guides/public-api
---

Record the Railway workspace ID as non-secret metadata.

Railway workspace tokens may span several capabilities. Create a token in the exact workspace, verify that it matches the recorded workspace ID, and store it only in the encrypted Railway profile.

Use a dedicated workspace when stronger separation is required. Before revoking an old token, save and validate its replacement.
