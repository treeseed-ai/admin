---
schemaVersion: treeseed.knowledge-page/v1
id: team.invitation
bookId: treeseed-team-administration
slug: invitation
title: Team invitation consent
summary: Send, review, resend, revoke, and explicitly accept team invitations.
status: published
visibility: public
order: 40
tags:
  - invitation
  - accept
  - resend
  - revoke
  - expiry
  - email mismatch
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - team.membership
  - team.overview
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.team.invite-accept
  - admin.team.members
routePatterns:
  - /team-invites/[token]/accept
  - /app/teams/[teamId]/members
resourceTypes:
  - team-invitation
actionIds: []
keywords:
  - invitation
  - accept
  - resend
  - revoke
  - expiry
  - email mismatch
documentationUrls: []
---

Every invitation requires explicit recipient acceptance, including invitations sent to an existing TreeSeed user.

The acceptance page shows the team, invited email, proposed role, inviter, and expiration before any membership is created. A signed-in account with a different verified email cannot consume the invitation.

Resending refreshes delivery without creating duplicate pending invitations. Revocation and expiration make the token unusable. Replaying an already accepted token is safe only for the same recipient.
