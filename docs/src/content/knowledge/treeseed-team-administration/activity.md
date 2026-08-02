---
schemaVersion: treeseed.knowledge-page/v1
id: team.activity
bookId: treeseed-team-administration
slug: activity
title: Team activity
summary: Read the human-centered history of security-sensitive team changes.
status: published
visibility: team
order: 10
tags:
  - activity
  - audit
  - actor
  - changes
  - history
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
  - admin.team.overview
routePatterns:
  - /app/teams/[teamId]
resourceTypes:
  - audit-event
actionIds:
  - team.audit.read
keywords:
  - activity
  - audit
  - actor
  - changes
  - history
documentationUrls: []
---

Activity entries identify what happened, when it happened in your time zone, and the person who performed the action when a public profile is available.

Technical correlation identifiers are retained for diagnostics but are not the primary human display. Credential values and other secrets never belong in audit details.

