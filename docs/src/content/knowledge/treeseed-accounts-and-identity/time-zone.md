---
schemaVersion: treeseed.knowledge-page/v1
id: account.time-zone
bookId: treeseed-accounts-and-identity
slug: time-zone
title: Display time zone
summary: Choose the IANA time zone used to format dates and times throughout
  authenticated TreeSeed pages.
status: published
visibility: authenticated
order: 100
groupIds:
  - date
  - iana
  - time-zone
  - timestamp
  - timezone
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - account.identity
  - account.sessions
  - account.notifications
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.account.identity
routePatterns:
  - /app/account
resourceTypes:
  - account-preferences
actionIds:
  - account.time-zone.update
keywords:
  - timezone
  - time zone
  - date
  - timestamp
  - IANA
documentationUrls: []
---

TreeSeed stores each event as an absolute instant. Your display time zone changes only how that instant is presented in the interface.

Choose the place whose daylight-saving rules you want TreeSeed to follow. The same setting is used during server rendering and later page updates so timestamps do not shift after loading.

