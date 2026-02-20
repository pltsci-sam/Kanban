# Spec: kanban-dashboard

| Field | Value |
|-------|-------|
| Type | fullstack |
| Status | Draft |
| Created | 2026-02-20 |
| Author | SPECOPS |

## Summary

A unified SDLC state visualization and human-agent collaboration surface for the AIFactory ecosystem. Provides a file-based kanban board (`.kanban/` directories) that agents drive and humans observe, steer, and unblock. Includes a VS Code extension for board interaction, a Claude Code skill for CLI access, adapter-based enrichment from existing systems (Ralph, SPECOPS, spec artifacts), and a read-only CMS web dashboard on the NUC for real-time agent activity monitoring. Agents create, move, and annotate cards as they drive features through the SDLC pipeline; humans review the board, answer blocker questions, and add context.

## Artifacts

- [Requirements](requirements.md) — 9 use cases, 27 functional requirements, 5 personas
- [Schemas](schemas.md) — 6 entities, file format specifications
- [State Machines](state-machines.md) — Card lifecycle, blocker state, CMS connection
- [API Contracts](api-contracts.md) — 7 integration surfaces with TypeScript interfaces
- [Acceptance Criteria](acceptance-criteria.md) — 67 acceptance criteria
- [NFR](nfr.md) — Performance, security, scalability, reliability, observability, accessibility
- [Glossary](glossary.md) — 27 canonical terms across 5 domain categories
- [Diagrams](diagrams.md) — 9 Mermaid diagrams: architecture, state machines, sequences, deployment

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HUMAN LAYER                               │
│  VS Code Board (read/write) │ CMS Dashboard (read-only)     │
│  Claude Code Skill (CLI)    │ Vivian (voice)  │ Slack        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              .kanban/ FILES (source of truth)                 │
│  board.yaml + cards/*.md + archive/*.md                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         AgentDispatch  SPECOPS    Vivian
         (orchestrate)  (execute)  (comms)
```

## Key Decisions

See [decisions.md](decisions.md)

## Open Questions

See [open-questions.md](open-questions.md)

## Changelog

See [changelog.md](changelog.md)
