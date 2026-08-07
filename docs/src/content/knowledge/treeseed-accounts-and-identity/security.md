---
schemaVersion: treeseed.knowledge-page/v1
id: account.security
bookId: treeseed-accounts-and-identity
slug: security
title: Passwords, email addresses, and connected identities
summary: Manage account sign-in methods without weakening recovery or exposing
  private addresses.
status: published
visibility: authenticated
order: 80
groupIds:
  - email
  - password
  - provider
  - security
  - verification
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - account.identity
  - account.sessions
  - account.deletion
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
actionIds: []
keywords:
  - password
  - provider
  - email
  - verification
  - security
documentationUrls: []
---

TreeSeed can use a password, a configured identity provider, or both. Each connected identity should belong to you and remain recoverable.

## Password changes

Changing a password requires the current password when one already exists. New passwords use the same strength and confirmation checks as registration and password recovery.

## Verified email

A delivered confirmation message does not verify an address by itself. The one-time confirmation link must be opened successfully before the address becomes verified.

## Connected providers

Do not remove the last usable sign-in method. Before disconnecting a provider, confirm that another provider or password works.
