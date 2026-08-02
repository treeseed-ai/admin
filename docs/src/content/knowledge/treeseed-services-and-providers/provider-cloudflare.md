---
schemaVersion: treeseed.knowledge-page/v1
id: provider.cloudflare
bookId: treeseed-services-and-providers
slug: provider-cloudflare
title: Connecting Cloudflare safely
summary: Separate runtime, DNS, and storage tokens and restrict each one to
  exact account or zone resources.
status: published
visibility: authenticated
order: 90
tags:
  - cloudflare
  - pages
  - workers
  - dns
  - r2
  - api token
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
  - cloudflare
  - pages
  - workers
  - dns
  - r2
  - api token
documentationUrls:
  - https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
---

Record the Cloudflare account ID as non-secret metadata. Never use the Global API Key.

Create separate custom API tokens for frontend runtime, DNS, and storage capabilities. Grant only the permission named by the enabled capability and restrict resources to the connected account or exact managed zones.

Save each one-time token in its matching encrypted profile. Rotating one capability token should not require exposing or replacing unrelated credentials.
