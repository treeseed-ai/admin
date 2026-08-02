---
schemaVersion: treeseed.knowledge-page/v1
id: team.ownership
bookId: treeseed-team-administration
slug: ownership
title: Team ownership
summary: Grant or transfer ownership without leaving a team with no accountable owner.
status: published
visibility: team
order: 90
tags:
  - owner
  - ownership
  - transfer
  - last owner
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - team.roles
  - team.role-changes
  - team.removal
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
  - team.ownership.transfer
  - team.owner.grant
  - team.owner.remove
keywords:
  - owner
  - ownership
  - transfer
  - last owner
documentationUrls: []
---

Owners hold the team’s highest security authority. Only an owner may grant, remove, or transfer ownership.

TreeSeed protects the last owner transactionally. Add or transfer ownership before the only owner changes role, leaves, or is removed. Ownership access and credential-vault grants are separate; update both when responsibilities change.

