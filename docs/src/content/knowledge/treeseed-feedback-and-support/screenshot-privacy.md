---
schemaVersion: treeseed.knowledge-page/v1
id: feedback.screenshot-privacy
bookId: treeseed-feedback-and-support
slug: screenshot-privacy
title: Screenshot capture and redaction
summary: Understand what the optional browser capture masks and how private
  images are retained.
status: published
visibility: authenticated
order: 50
groupIds:
  - attachment
  - capture
  - privacy
  - redact
  - screenshot
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - feedback.submitting
  - feedback.privacy
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.feedback.submit
routePatterns:
  - /app/*
resourceTypes:
  - feedback-attachment
actionIds: []
keywords:
  - screenshot
  - capture
  - redact
  - privacy
  - attachment
documentationUrls: []
---

Screenshot capture happens in your browser and includes the complete page, including content below the visible viewport and any help, dialog, or popover that is open when you capture it. On desktop, the image ends at the page edge beside the feedback panel, so the panel never covers or changes the recorded page.

Typed values in freeform form controls, editable content, and explicitly marked private regions are masked while ordinary navigation, labels, selectors, and non-sensitive page content remain visible. Embedded content that cannot be captured safely is marked unavailable rather than presented as a privacy redaction.

Always inspect the preview before sending. Select the thumbnail to open a larger, scrollable review and close it when you are finished. Capture never uploads automatically, and you can replace or remove it.

Screenshots are stored privately. They remain available while feedback is open and expire 90 days after resolution.
