# Kanban Dashboard — Open Questions

| ID | Question | Owner | Deadline | Impact |
|----|----------|-------|----------|--------|
| OQ-001 | What is the monorepo structure for AIFactory? Which projects go in which directories? (e.g., `packages/`, `apps/`, `skills/`) | Sam | Before implementation | Blocks directory structure, import paths, build config |
| OQ-002 | Should the CMS ops dashboard be a new Astro route on the existing CMS, or a standalone lightweight web app? | Sam | Phase 6 | Affects CMS architecture and deployment |
| OQ-003 | How should board.yaml handle concurrent writes from multiple agents? (Options: file locking, optimistic concurrency, last-writer-wins) | Engineering | Phase 3 | Affects AgentDispatch adapter implementation |
| OQ-004 | What is the auto-archive interval default? (Proposed: 30 days) | Sam | Phase 1 | Configurable — just need a sensible default |
| OQ-005 | Should the Slack adapter create kanban cards directly via file I/O, or route through AgentDispatch API? | Sam | Phase 4 | Affects Slack integration architecture |
