---
schemaVersion: treeseed.knowledge-page/v1
id: feedback.exports
bookId: treeseed-feedback-and-support
slug: exports
title: Privacy-safe feedback exports
summary: Prepare bounded feedback bundles for human review and AI-assisted remediation.
status: published
visibility: admin
order: 30
tags:
  - export
  - AI
  - JSONL
  - ZIP
  - privacy
  - provenance
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - feedback.administration
  - feedback.triage
  - feedback.privacy
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.feedback.collection
routePatterns:
  - /app/feedback
resourceTypes:
  - feedback-export
actionIds: []
keywords:
  - export
  - AI
  - JSONL
  - ZIP
  - privacy
  - provenance
documentationUrls: []
---

An export contains at most 500 selected or filtered records. The ZIP includes a policy manifest, agent-oriented JSONL, and a human-readable Markdown review.

Direct personal identifiers such as email, display name, username, and profile image are omitted. Opaque identifiers, route and build context, the message, status, and resolution history remain so work can be correlated safely.

Exports expire after 7 days. Creating an export records provenance but does not change feedback status.
