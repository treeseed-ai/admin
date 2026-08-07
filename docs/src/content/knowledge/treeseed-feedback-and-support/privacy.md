---
schemaVersion: treeseed.knowledge-page/v1
id: feedback.privacy
bookId: treeseed-feedback-and-support
slug: privacy
title: Feedback privacy boundary
summary: Learn which context is stored, who can inspect it, and how retention works.
status: published
visibility: authenticated
order: 40
groupIds:
  - audit
  - contact
  - identity
  - privacy
  - retention
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - feedback.submitting
  - feedback.screenshot-privacy
  - feedback.exports
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.feedback.submit
  - admin.feedback.detail
routePatterns:
  - /app/*
resourceTypes:
  - feedback-privacy
actionIds: []
keywords:
  - privacy
  - identity
  - retention
  - audit
  - contact
documentationUrls: []
---

Feedback text and private attachment metadata are durable feedback records. Audit events contain correlation identifiers and status metadata only; they do not duplicate messages, email addresses, browser details, or images.

Only platform administrators can read reports. Attachment and export downloads pass through authorized, no-store API responses and never reveal raw storage keys or provider URLs.

Feedback text and status history remain for auditability. Screenshots expire 90 days after resolution and export bundles expire after 7 days.
