---
schemaVersion: treeseed.knowledge-page/v1
id: account.connected-identities
bookId: treeseed-accounts-and-identity
slug: connected-identities
title: Connected sign-in identities
summary: Understand how external sign-in providers attach to your account and
  when they may be removed.
status: published
visibility: authenticated
order: 20
tags:
  - provider
  - sign-in
  - identity
  - github
  - google
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - account.security
  - account.emails
  - account.sessions
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
  - account
actionIds:
  - account.provider.connect
  - account.provider.disconnect
keywords:
  - provider
  - sign-in
  - identity
  - github
  - google
documentationUrls: []
---

Connected identities let an approved provider authenticate the same TreeSeed account. Connecting a provider does not grant that provider access to team service credentials.

Before disconnecting an identity, keep another working sign-in method: a password or a second connected provider. Review active sessions after any unexpected provider change.

