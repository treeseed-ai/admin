---
schemaVersion: treeseed.knowledge-page/v1
id: provider.github
bookId: treeseed-services-and-providers
slug: provider-github
title: Connecting GitHub safely
summary: Use a GitHub App installation with capability-specific repository,
  workflow, and secret authority.
status: published
visibility: authenticated
order: 100
tags:
  - github app
  - installation
  - actions
  - repositories
  - secrets
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.connect
  - services.providers
  - services.credentials
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds: []
routePatterns: []
resourceTypes: []
actionIds: []
keywords:
  - github app
  - installation
  - actions
  - repositories
  - secrets
documentationUrls:
  - https://docs.github.com/apps/creating-github-apps
---

Prefer a GitHub App over a personal access token.

1. Create or open a GitHub App in organization settings.
2. Grant metadata read access plus only the repository contents, Actions, and secrets permissions required by enabled capabilities.
3. Install the App on only the repositories TreeSeed may manage.
4. Record the public App and installation IDs.
5. Generate a private key, save it into the encrypted credential profile, validate it, and remove the downloaded file.

Repository selection and App permissions jointly define the authority boundary.
