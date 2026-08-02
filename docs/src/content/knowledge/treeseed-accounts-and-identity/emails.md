---
schemaVersion: treeseed.knowledge-page/v1
id: account.emails
bookId: treeseed-accounts-and-identity
slug: emails
title: Email addresses and verification
summary: Add, verify, promote, and remove account email addresses without
  weakening account recovery.
status: published
visibility: authenticated
order: 40
tags:
  - email
  - verification
  - primary
  - recovery
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - account.identity
  - account.security
  - account.connected-identities
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
  - account.email.add
  - account.email.verify
  - account.email.primary
  - account.email.remove
keywords:
  - email
  - verification
  - primary
  - recovery
documentationUrls: []
---

## What verification proves

TreeSeed sends a one-time link to each new address. The address remains pending until that exact link is accepted. Verification proves access to the mailbox; it does not change the primary address automatically.

## Keep a recovery path

An account must retain a usable verified address. Set another verified address as primary before removing the current primary address. If a link expires, request a new message from the email row rather than adding the address again.

