---
schemaVersion: treeseed.knowledge-page/v1
id: team.removal
bookId: treeseed-team-administration
slug: removal
title: Removing a member or leaving
summary: Resolve ownership and resource blockers before access is removed.
status: published
visibility: team
order: 100
tags:
  - remove
  - leave
  - blockers
  - lost access
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - team.membership
  - team.ownership
  - team.role-changes
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.team.members
routePatterns:
  - /app/teams/[teamId]/members
resourceTypes:
  - team-membership
actionIds:
  - team.member.remove
  - team.member.leave
keywords:
  - remove
  - leave
  - blockers
  - lost access
documentationUrls: []
---

Removal and self-leave revoke team access immediately after the operation succeeds. TreeSeed first checks ownership and any team-owned responsibilities that must be reassigned.

Resolve every displayed blocker at its linked management page. A sole owner must transfer or grant ownership before leaving or being removed.

