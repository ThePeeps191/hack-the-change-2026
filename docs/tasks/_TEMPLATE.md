---
id: T-000
title: Short imperative title
owner: any # danny | siddhant | aaron | jonas | any
wave: 1 # 0 = foundation, which blocks all other waves; above 0 it's only a label, so order with depends_on
status: todo # todo | done; the task's own PR sets done
depends_on: [] # task ids that must merge first
owns: # exact files or dir/** only; nothing outside this list may change
  - path/to/feature/**
---

<!-- Copy to docs/tasks/T-012-short-slug.md. An agent starts with only CLAUDE.md
     and this file, so it has to stand alone. -->

## Goal

What exists when this is finished, and why it matters to the demo.

## Context

Decisions and background needed to do this without reading the rest of the plan.
Link to the relevant section of docs/PLAN.md.

## Contracts

- **Uses:** types, endpoints or modules this consumes, and where they live.
- **Provides:** what later tasks can rely on.

## Done when

- [ ] Observable outcome someone can check
- [ ] Tests or a manual check that prove it

## Out of scope

What looks related but belongs to another task, naming that task where there is one.
