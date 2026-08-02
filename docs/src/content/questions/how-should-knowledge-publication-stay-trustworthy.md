---
id: question:trustworthy-knowledge-publication
title: How should knowledge publication stay trustworthy?
description: Defines the evidence boundary for repository-native knowledge authoring and publication.
summary: Establishes which correlated records must agree before TreeSeed treats a knowledge revision as published and pack-ready.
date: 2026-08-01
status: live
tags:
  - knowledge
  - review
  - publication
draft: false
questionType: implementation
motivation: A knowledge UI must not report success when Git, TreeDX, the published manifest, the reader, or derived packs refer to different source revisions.
primaryContributor: admin-steward
relatedObjectives:
  - objective:admin-core
relatedBooks:
  - treeseed-team-administration
---

How should knowledge publication stay trustworthy? TreeSeed must define which exact postconditions agree across the authoring workspace, independent review, repository commit, TreeDX graph, atomic publication pointer, Starlight reader, contextual knowledge, and knowledge-pack artifacts.
