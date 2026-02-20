# Kanban Dashboard — Diagrams

9 Mermaid diagrams in `diagrams/`, one per `.mmd` file.

| # | File | Type | Description |
|---|------|------|-------------|
| 1 | [01-system-architecture.mmd](diagrams/01-system-architecture.mmd) | Flowchart | All components (VS Code, CLI, CMS, Vivian, Slack), file system, agent layer, CMS infrastructure |
| 2 | [02-card-lifecycle.mmd](diagrams/02-card-lifecycle.mmd) | State Diagram | 8-state SDLC pipeline: Backlog → Spec Creation → Spec Review → Building → Testing → Human Review → Done → Archived |
| 3 | [03-sdlc-sequence.mmd](diagrams/03-sdlc-sequence.mmd) | Sequence | End-to-end card journey through creation, spec, build, blocker, test, and completion phases |
| 4 | [04-blocker-resolution.mmd](diagrams/04-blocker-resolution.mmd) | Flowchart | Multi-channel blocker notification (VS Code, Slack, Vivian) → human resolves → agent resumes |
| 5 | [05-cms-connection.mmd](diagrams/05-cms-connection.mmd) | State Diagram | WebSocket lifecycle: Disconnected → Connecting → Connected → Reconnecting |
| 6 | [06-card-file-format.mmd](diagrams/06-card-file-format.mmd) | Flowchart | Card `.md` file structure (YAML frontmatter + Markdown body) linked to `board.yaml` cardOrder |
| 7 | [07-adapter-enrichment.mmd](diagrams/07-adapter-enrichment.mmd) | Flowchart | Ralph, Specops, and SpecArtifact adapters enriching cards with build/spec/requirement data |
| 8 | [08-deployment.mmd](diagrams/08-deployment.mmd) | Flowchart | Physical deployment: dev machine, Intel NUC (LAN), browser, external services with auth boundaries |
| 9 | [09-cms-event-flow.mmd](diagrams/09-cms-event-flow.mmd) | Sequence | CMS dashboard: HTTP auth → WebSocket upgrade → real-time events → SSE thinking → reconnection |
