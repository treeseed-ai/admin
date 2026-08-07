---
schemaVersion: treeseed.knowledge-page/v1
id: services.external-vault
bookId: treeseed-services-and-providers
slug: external-vault
title: External vault references
summary: Configure unattended credential references without storing a long-lived
  vault token.
status: published
visibility: authenticated
order: 80
groupIds:
  - jwt
  - oidc
  - openbao
  - vault
  - workload-identity
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - provider.openbao
  - services.credentials
  - vault.overview
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.services.detail
routePatterns:
  - /app/services/[connectionId]
resourceTypes:
  - external-vault-binding
actionIds: []
keywords:
  - vault
  - openbao
  - oidc
  - jwt
  - workload identity
documentationUrls: []
---

An external vault binding stores an HTTPS address, secrets mount, and workload-identity role. It does not store a long-lived Vault or OpenBao token.

The operations runner authenticates with OIDC/JWT workload identity and resolves only an approved secret reference for an authorized operation.

Treat an external vault as an unattended execution source, not a way to recover personal TreeSeed passphrases or decrypt the client-managed team vault.
