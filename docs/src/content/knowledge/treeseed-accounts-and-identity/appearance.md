---
schemaVersion: treeseed.knowledge-page/v1
id: account.appearance
bookId: treeseed-accounts-and-identity
slug: appearance
title: Themes and appearance
summary: Create personal themes and choose the active appearance safely.
status: published
visibility: authenticated
order: 10
groupIds:
  - appearance
  - colors
  - contrast
  - dark-mode
  - theme
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - account.identity
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.account.appearance
routePatterns:
  - /app/account/appearance
resourceTypes:
  - personal-theme
actionIds: []
keywords:
  - theme
  - appearance
  - colors
  - dark mode
  - contrast
documentationUrls: []
---

Built-in themes are maintained by TreeSeed. Personal themes let you derive a reusable palette from a built-in base.

Creating or editing a personal theme does not activate it automatically. Choose the active theme from the application header.

The same selector can enable **Content theme overlay**. It gives the application content workspace an independent scheme and mode while leaving the header, team navigation, documentation, feedback, help, and account controls on the normal application appearance. Choose **Match application** to follow the shell's light or dark mode, or select a fixed or system-driven content mode.

The overlay does not make interface elements translucent. Workspace backgrounds blend toward the selected scheme while text, focus indicators, actions, and status colors remain fully opaque and contrast-safe. Content command overlays use the workspace palette too.

On the appearance page, changing the active theme reloads the page once so the editor and application shell use the same saved palette. Check both light and dark palettes for readable contrast before relying on a custom theme.
