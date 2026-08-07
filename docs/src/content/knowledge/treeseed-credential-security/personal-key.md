---
schemaVersion: treeseed.knowledge-page/v1
id: vault.personal-key
bookId: treeseed-credential-security
slug: personal-key
title: Step 1 — Create personal vault access
summary: Create an administrator key protected by a personal passphrase that is
  separate from your account password.
status: published
visibility: authenticated
order: 30
groupIds:
  - account-password
  - administrator-key
  - personal-passphrase
  - step-1
contributors: []
relatedBookIds: []
relatedKnowledgeIds:
  - vault.team-custody
  - vault.recovery
  - vault.rotation
  - vault.overview
relatedNoteIds: []
relatedQuestionIds: []
relatedObjectiveIds: []
relatedProposalIds: []
relatedDecisionIds: []
capabilityIds:
  - admin.services.vault
routePatterns:
  - /app/services/vault
resourceTypes:
  - user-vault-key
actionIds: []
keywords:
  - step 1
  - personal passphrase
  - administrator key
  - account password
documentationUrls: []
---

Step 1 creates a public/private encryption keypair in your browser.

Choose a new **personal vault passphrase**. This is not your TreeSeed account password. The passphrase derives a local encryption key that protects the private half of your administrator keypair.

Only the public key and encrypted private-key envelope are sent to TreeSeed. The passphrase and derived key remain in browser memory and are discarded after the operation.

You will re-enter this same passphrase in step 2. Step 2 does not create another passphrase.
