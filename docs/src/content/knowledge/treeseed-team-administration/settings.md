---
schemaVersion: treeseed.knowledge-page/v1
id: team.settings
bookId: treeseed-team-administration
slug: settings
title: Team identity and public visibility
summary: Maintain the team name, display identity, logo, summary, and profile
  visibility.
status: published
visibility: authenticated
order: 130
tags:
  - team settings
  - identity
  - public profile
  - visibility
  - conflict
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - team.overview
  - team.membership
  - team.lifecycle
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.team.edit
routePatterns:
  - /app/teams/[teamId]/edit
resourceTypes:
  - team
actionIds: []
keywords:
  - team settings
  - identity
  - public profile
  - visibility
  - conflict
documentationUrls: []
---

Team settings contain identity owned by the team domain. Project, host, capacity, knowledge, and commerce settings remain in their own domains.

The team name is used for the public profile address. The display name is presentation only and is never used for ambiguous lookup.

Updates use optimistic version checks. If another administrator saves first, reload the current state and deliberately reapply your change rather than overwriting it silently.
