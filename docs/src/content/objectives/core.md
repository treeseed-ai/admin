---
id: objective:admin-core
title: TreeSeed Admin Core Objective
description: TreeSeed Admin should provide the distributable Treeseed administration portal for teams, projects, hosts, work, knowledge, catalog browsing, operational status, secret-manager workflows, and capacity operator surfaces.
date: 2026-06-22
summary: TreeSeed Admin exists to provide the distributable Treeseed administration portal for teams, projects, hosts, work, knowledge, catalog browsing, operational status, secret-manager workflows, and capacity operator surfaces while preserving its package boundary.
status: live
timeHorizon: long-term
motivation: Package-local workdays need a stable north star from the README so humans and agents can plan, execute, review, and report work without drifting across package ownership boundaries.
primaryContributor: admin-steward
relatedQuestions: []
relatedBooks: []
---

TreeSeed Admin exists to provide the distributable Treeseed administration portal for teams, projects, hosts, work, knowledge, catalog browsing, operational status, secret-manager workflows, and capacity operator surfaces.

This core objective is the starting direction for the TreeSeed Admin Knowledge Hub. It should influence every package-local workday, research note, implementation proposal, generated artifact, approval request, and release-readiness summary.

Admin must stay a browser administration layer over API, SDK, Core, and UI contracts. It must not own scheduling, assignment selection, provider runtime internals, backend persistence, reusable UI primitives, or ecommerce checkout policy.

Agents working in this project should keep outputs grounded in the package README, package-local source evidence, and the TreeSeed package ownership map. When a task would cross into another package's authority, the agent should describe the boundary and route the work to the correct project instead of mutating outside this hub.
