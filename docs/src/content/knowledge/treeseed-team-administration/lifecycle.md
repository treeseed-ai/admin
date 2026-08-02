---
schemaVersion: treeseed.knowledge-page/v1
id: team.lifecycle
bookId: treeseed-team-administration
slug: lifecycle
title: Archiving, restoring, and deleting a team
summary: Pause team activity reversibly or permanently delete it through a
  separate protected action.
status: published
visibility: authenticated
order: 50
tags:
  - archive
  - restore
  - delete team
  - blockers
  - password
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - team.overview
  - team.membership
  - teams.collection
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.team.delete
routePatterns:
  - /app/teams/[teamId]/delete
resourceTypes:
  - team
actionIds: []
keywords:
  - archive
  - restore
  - delete team
  - blockers
  - password
documentationUrls: []
---

Archiving and deletion are separate operations.

## Archive and restore

Archiving pauses new team-scoped mutations, revokes pending invitations, and removes the team from active selectors. The displayed recovery deadline uses your account time zone. Owners may restore the team while recovery remains available.

## Permanent deletion

Permanent deletion is immediate and irreversible. It requires a fresh blocker evaluation, recent reauthentication, the current account password, and the exact team name shown by the form.

If blocker evaluation is unavailable, deletion fails closed and the team remains unchanged.
