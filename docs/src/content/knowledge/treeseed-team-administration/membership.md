---
schemaVersion: treeseed.knowledge-page/v1
id: team.membership
bookId: treeseed-team-administration
slug: membership
title: Members, invitations, roles, and ownership
summary: Find team members and understand which operations require an
  administrator or owner.
status: published
visibility: authenticated
order: 70
groupIds:
  - invitation
  - leave
  - members
  - ownership
  - remove
  - roles
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - team.invitation
  - team.overview
  - team.lifecycle
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
actionIds: []
keywords:
  - members
  - roles
  - ownership
  - invitation
  - remove
  - leave
documentationUrls: []
---

Every team member may view and search the member directory. Membership mutations remain limited by role.

## Roles and ownership

Owners control ownership, lifecycle, and every membership operation. Project leads may invite and manage non-owner memberships but cannot create, demote, remove, or replace owners.

The only owner cannot change their own role, leave, or be removed until another owner exists or ownership is explicitly transferred.

## Removal and leaving

TreeSeed evaluates blockers before access is removed. A successful removal or leave operation takes effect immediately and must prevent further team access.
