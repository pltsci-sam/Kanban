# Kanban Dashboard Glossary

Canonical terminology for this specification. All spec artifacts should use these terms consistently.

---

## Board & Cards

| Canonical Term | Aliases to Retire | Definition |
|---|---|---|
| **Board** | kanban, project board, task board | A single repository's kanban configuration stored in `.kanban/board.yaml`. One board per repo. Maps to the `Board` entity. |
| **Card** | task, issue, ticket, item, work item | A unit of work stored as a markdown file in `.kanban/cards/{id}.md`. Contains YAML frontmatter (metadata) and markdown body (description + notes). Maps to the `Card` entity. |
| **Column** | lane, list, status, phase | A vertical section of the board representing an SDLC phase. Configured in `board.yaml` columns array. Maps to the `ColumnDefinition` interface. |
| **Card ID** | task ID, ticket number | A 6-character lowercase alphanumeric identifier (`^[a-z0-9]{6}$`) unique within a board. Used as the card filename. |
| **Card Order** | ordering, sort order, position | The ordered list of card IDs within a column, stored in `board.yaml` `cardOrder` map. Determines visual display order. |
| **Label** | tag, category | A named color-coded classification applied to cards. Defined in `board.yaml` `labels` array. Maps to `LabelDefinition`. |
| **WIP Limit** | work-in-progress limit | A per-column integer indicating the recommended maximum number of active cards. Display-only — not enforced (BR-003). |

## SDLC Pipeline

| Canonical Term | Aliases to Retire | Definition |
|---|---|---|
| **SDLC Column** | pipeline stage, workflow step | The default column set aligned to the SPECOPS development lifecycle: Backlog, Spec Creation, Spec Review, Building, Testing, Human Review, Done. |
| **Blocker** | block, impediment, question | A structured entry in a card's `blockers` frontmatter list indicating the card cannot proceed without human input. Contains `id`, `question`, `author`, and `created` fields. |
| **Unblock** | resolve, answer, unimpede | The action of removing a blocker from a card's frontmatter and appending the human's answer as a note. Triggers AgentDispatch to resume work. |
| **Milestone Note** | activity note, agent note | A dated markdown section appended to a card body by an agent, summarizing phase completion with files modified and test results. |
| **Auto-Archive** | auto-cleanup, purge | The process of moving cards from `cards/` to `archive/` after they've been in a Done column for N days (BR-002). |

## AIFactory Ecosystem

| Canonical Term | Aliases to Retire | Definition |
|---|---|---|
| **AIFactory** | ecosystem, platform, system | The unified autonomous development ecosystem comprising SPECOPS, AgentDispatch, Vivian, and supporting skills (ChartFlow, PSCanvas, Kanban, CMS). |
| **AgentDispatch** | orchestrator, dispatcher, AgentSwarm | The 24/7 SDLC orchestrator service running on the NUC. Reads/writes `.kanban/` files, dispatches SPECOPS agents, manages task lifecycle. |
| **SPECOPS** | spec system, SDLC tooling | The spec-driven development plugin providing 19 specialist agents and 14 skills for the full specification and build lifecycle. |
| **Vivian** | voice assistant, comms layer | The voice AI assistant that joins meetings, creates action items as kanban cards, and announces blockers. |
| **Ralph Harness** | ralph, build harness | The persistent autonomous build system stored in `.ralph/` directories. Tracks features, phases, and progress across multi-session builds. |
| **Heartbeat** | scan, poll, check | AgentDispatch's periodic (5-minute) scan of repository state files (`.specops/state.json`, `.kanban/board.yaml`) to discover work. |

## Adapters & Enrichment

| Canonical Term | Aliases to Retire | Definition |
|---|---|---|
| **Adapter** | connector, reader, data source | A module that reads data from an external source (`.ralph/`, `.specops/`, `specs/`) and returns enrichment data for card display. |
| **Enrichment** | augmentation, decoration | Additional display data (build progress, spec status, open questions) loaded from adapters at render time. Not stored in the card. |
| **Ralph Adapter** | — | Adapter that reads `.ralph/features.json` and matches features to cards via `ralphFeature` reference. Returns build progress. |
| **Specops Adapter** | — | Adapter that reads `.specops/state.json` and matches features to cards via `specRef` reference. Returns spec phase status. |
| **Spec Artifact Adapter** | — | Adapter that reads `specs/*/open-questions.md` and `specs/*/decisions.md` and returns counts for card display. |

## Infrastructure

| Canonical Term | Aliases to Retire | Definition |
|---|---|---|
| **NUC** | server, host machine | The Intel NUC11PAHi7 at 192.168.68.69 running AgentDispatch, Vivian, and the CMS dashboard. |
| **CMS Dashboard** | ops dashboard, live view, war room | The read-only web dashboard running on the NUC that displays real-time agent activity, pipeline state, and blocked items. |
| **Projects Registry** | projects.yaml, project config | The `projects.yaml` file in the Kanban project that lists all AIFactory repos for cross-repo dashboard aggregation. |

---

## Usage Guidelines

1. **In spec artifacts**: Always use the canonical term.
2. **In code**: Entity names, enum values, and API field names should align with canonical terms.
3. **In user-facing text**: Use the term most natural for the persona when the canonical term would be confusing to end users.
