---
schemaVersion: treeseed.knowledge-page/v1
id: account.sessions
bookId: treeseed-accounts-and-identity
slug: sessions
title: Account sessions and device access
summary: Review signed-in devices, timestamps, network addresses, and safe
  session revocation.
status: published
visibility: authenticated
order: 90
tags:
  - sessions
  - devices
  - revoke
  - ip address
  - sign out
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - account.security
  - account.deletion
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.account.sessions
routePatterns:
  - /app/account/sessions
resourceTypes:
  - account-session
actionIds: []
keywords:
  - sessions
  - devices
  - revoke
  - ip address
  - sign out
documentationUrls: []
---

Each session represents a browser or device that can currently act as your account.

The list shows the user agent, recorded network address when available, creation time, and most recent activity using your account time zone.

## Revoking access

Revoke sessions you do not recognize or no longer use. The current session is protected from accidental inline revocation; use **Sign out** for the device you are using now.

After a session is revoked, requests carrying that session must be rejected.
