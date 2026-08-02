---
schemaVersion: treeseed.knowledge-page/v1
id: provider.openbao
bookId: treeseed-services-and-providers
slug: provider-openbao
title: Connecting OpenBao or HashiCorp Vault
summary: Use workload identity and references instead of storing a reusable vault token.
status: published
visibility: authenticated
order: 110
tags:
  - openbao
  - hashicorp vault
  - oidc
  - jwt
  - workload identity
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - services.external-vault
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
  - openbao
  - hashicorp vault
  - oidc
  - jwt
  - workload identity
documentationUrls:
  - https://openbao.org/docs/auth/jwt/
---

Configure an HTTPS vault address, secrets mount, and an OIDC/JWT role dedicated to TreeSeed operations.

The role should authorize only expected paths and operations. The operations runner exchanges its workload identity for short-lived access when an authorized unattended operation begins.

Do not enter a personal, root, or long-lived vault token. External vaults do not store or recover TreeSeed personal passphrases.
