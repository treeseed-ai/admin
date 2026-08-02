---
schemaVersion: treeseed.knowledge-page/v1
id: team.visibility
bookId: treeseed-team-administration
slug: visibility
title: Team profile visibility
summary: Control whether the team identity profile is public without changing
  project or knowledge-plane visibility.
status: published
visibility: team
order: 140
tags:
  - visibility
  - public
  - private
  - profile
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - team.settings
  - team.overview
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
actionIds:
  - team.visibility.update
keywords:
  - visibility
  - public
  - private
  - profile
documentationUrls: []
---

Team profile visibility controls only the public team identity page. It does not make projects public or private and does not select where project knowledge is indexed.

Public profiles expose approved identity fields. Memberships, roles, emails, operational counts, billing, hosts, and private metadata remain redacted.

