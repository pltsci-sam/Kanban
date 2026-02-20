# Kanban Dashboard Schemas

> Data model for the file-based kanban system. All entities are persisted as YAML or Markdown files within `.kanban/` directories in each repository. There is no database -- git is the persistence and versioning layer.

---

## Board

The top-level configuration for a single repository's kanban board, stored at `.kanban/board.yaml`.

### Fields

| Field | Type | Constraints | Description | File Location |
|-------|------|-------------|-------------|---------------|
| name | string | NOT NULL, MAX(100) | Display name for the board | board.yaml `name` |
| description | string | NULL, MAX(500) | Optional board description | board.yaml `description` |
| columns | Column[] | NOT NULL, MIN(1) | Ordered list of column configurations | board.yaml `columns` |
| labels | Label[] | NOT NULL, DEFAULT [] | Available labels for cards on this board | board.yaml `labels` |
| cardOrder | map\<string, string[]\> | NOT NULL | Map of column name to ordered list of card IDs | board.yaml `cardOrder` |
| settings | BoardSettings | NOT NULL | Board-level configuration | board.yaml `settings` |
| version | integer | NOT NULL, DEFAULT 1 | Schema version for forward compatibility | board.yaml `version` |

### BoardSettings (embedded)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| autoArchiveDays | integer | NOT NULL, DEFAULT 30, MIN(1) | Days in Done before auto-archiving (BR-002) |
| defaultPriority | string | NOT NULL, DEFAULT 'medium', ENUM(critical, high, medium, low) | Default priority for new cards |
| defaultColumn | string | NOT NULL, DEFAULT 'Backlog' | Column for newly created cards |
| idFormat | string | NOT NULL, DEFAULT 'alphanumeric6', ENUM(alphanumeric6) | Card ID generation strategy |

### Relationships

- **Board** 1:N **Card** via `cardOrder` referencing card IDs (files in `.kanban/cards/`)
- **Board** 1:N **Column** via `columns` (embedded)
- **Board** 1:N **Label** via `labels` (embedded)

### File Format: board.yaml

```yaml
version: 1
name: "AgentDispatch"
description: "SDLC pipeline board for the AgentDispatch orchestrator"

columns:
  - name: Backlog
    wipLimit: null
    done: false
    description: "Work items awaiting prioritization"
  - name: Spec Creation
    wipLimit: 3
    done: false
    description: "Requirements and schema design in progress"
  - name: Spec Review
    wipLimit: 2
    done: false
    description: "Specs awaiting human review"
  - name: Building
    wipLimit: 3
    done: false
    description: "Implementation in progress"
  - name: Testing
    wipLimit: 3
    done: false
    description: "Verification and test execution"
  - name: Human Review
    wipLimit: 2
    done: false
    description: "Awaiting human approval"
  - name: Done
    wipLimit: null
    done: true
    description: "Completed work items"

labels:
  - name: bug
    color: "#e11d48"
  - name: feature
    color: "#2563eb"
  - name: infra
    color: "#7c3aed"
  - name: docs
    color: "#059669"
  - name: urgent
    color: "#dc2626"
  - name: blocked
    color: "#f59e0b"

cardOrder:
  Backlog:
    - "a1b2c3"
    - "d4e5f6"
  Spec Creation:
    - "g7h8i9"
  Spec Review: []
  Building: []
  Testing: []
  Human Review: []
  Done:
    - "x1y2z3"

settings:
  autoArchiveDays: 30
  defaultPriority: medium
  defaultColumn: Backlog
```

### Validation Rules

- Every card ID in `cardOrder` MUST correspond to a file at `.kanban/cards/{id}.md`
- A card ID MUST NOT appear in more than one column's `cardOrder` list
- Every column name used as a key in `cardOrder` MUST be defined in `columns`
- Column names MUST be unique within the `columns` list
- Label names MUST be unique within the `labels` list

---

## Card

A single work item representing a task in the SDLC pipeline. Each card is a Markdown file with YAML frontmatter stored at `.kanban/cards/{id}.md`. Cards are intentionally thin -- they carry identity and status, while SDLC enrichment (build progress, spec phase) comes from adapters at display time (BR-004).

### Frontmatter Fields

| Field | Type | Constraints | Description | Traces To |
|-------|------|-------------|-------------|-----------|
| id | string | PK, NOT NULL, MATCH(^[a-z0-9]{6}$) | 6-character lowercase alphanumeric identifier | KB-008 |
| title | string | NOT NULL, MAX(200) | Human-readable card title | KB-023 |
| column | string | NOT NULL | Current column name (must match a board column) | KB-010, KB-024 |
| priority | string | NOT NULL, DEFAULT 'medium', ENUM(critical, high, medium, low) | Priority level | KB-023 |
| labels | string[] | NOT NULL, DEFAULT [] | List of label names applied to this card | KB-023 |
| assignee | string | NULL | Agent or human identifier assigned to this card | -- |
| created | datetime | NOT NULL, ISO 8601 | Timestamp of card creation | KB-007 |
| updated | datetime | NOT NULL, ISO 8601 | Timestamp of last modification | KB-006 |
| due | date | NULL, ISO 8601 | Optional due date | -- |
| source | string | NULL, ENUM(manual, agentdispatch, vivian, slack) | Origin of card creation | KB-027 |
| meeting | string | NULL, MAX(200) | Meeting title (when source is vivian) | KB-027 |
| pin | boolean | NOT NULL, DEFAULT false | If true, card is never auto-archived | BR-002 |
| blockers | Blocker[] | NOT NULL, DEFAULT [] | List of active blockers on this card | KB-006, KB-012 |
| specRef | string | NULL | Lightweight reference to spec path for adapter lookup (e.g., "specs/kanban-dashboard") | BR-004 |
| ralphFeature | string | NULL | Lightweight reference to Ralph feature ID for adapter lookup | BR-004 |

### Blocker (embedded in frontmatter)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | NOT NULL, MATCH(^blk-[a-z0-9]{4}$) | Blocker identifier |
| question | string | NOT NULL, MAX(500) | The question or issue blocking progress |
| author | string | NOT NULL | Who raised the blocker (agent ID or human name) |
| created | datetime | NOT NULL, ISO 8601 | When the blocker was raised |

### Markdown Body Conventions

The card body (below the YAML frontmatter) is structured Markdown containing the card description followed by chronologically appended notes. The body follows these conventions:

1. **Description section**: The first content after frontmatter is the card description (free-form Markdown).
2. **Notes section**: Notes are appended below a `## Notes` heading as dated subsections.
3. **Note format**: Each note is an `### {timestamp} — {author} [type]` heading (em dash separator, bracketed type tag) followed by the note content. The `type` tag corresponds to the `NoteType` enum: `comment`, `milestone`, `blocker`, `unblock`.
4. **Note types**: Notes may be agent milestone notes (`[milestone]`), human context notes (`[comment]`), blocker notes (`[blocker]`), or blocker resolution notes (`[unblock]`).

### File Format: Card .md

```markdown
---
id: a1b2c3
title: "Implement WebSocket reconnection logic"
column: Building
priority: high
labels:
  - feature
  - infra
assignee: agentdispatch
created: "2026-02-18T10:30:00Z"
updated: "2026-02-20T14:22:00Z"
due: "2026-02-25"
source: agentdispatch
pin: false
blockers: []
specRef: "specs/websocket-reconnect"
ralphFeature: "ws-reconnect-001"
---

Implement automatic WebSocket reconnection with exponential backoff
for the CMS dashboard connection to AgentDispatch.

## Acceptance Criteria

- Connection retries with exponential backoff (1s, 2s, 4s, max 30s)
- Visual indicator shows connection state
- Queued messages replayed on reconnect

## Notes

### 2026-02-18T10:30:00Z — agentdispatch [milestone]

**Phase: Card Created**
Card created from SPECOPS feature detection.
Source feature: `.specops/state.json#ws-reconnect`

### 2026-02-19T09:15:00Z — specops-requirements [milestone]

**Phase: Spec Creation Complete**
- Created: `specs/websocket-reconnect/requirements.md`
- Created: `specs/websocket-reconnect/schemas.md`
- Open questions: 2 (see `specs/websocket-reconnect/open-questions.md`)

### 2026-02-20T14:22:00Z — specops-builder [milestone]

**Phase: Building Started**
- Implementation branch: `feat/ws-reconnect`
- Files modified: `src/cms/websocket.ts`, `src/cms/reconnect.ts`
```

### Card with Active Blocker Example

```markdown
---
id: d4e5f6
title: "Configure Slack webhook for blocker notifications"
column: Building
priority: medium
labels:
  - feature
assignee: specops-builder
created: "2026-02-17T08:00:00Z"
updated: "2026-02-19T16:45:00Z"
source: manual
pin: false
blockers:
  - id: blk-x1y2
    question: "What Slack channel should receive blocker notifications? #ops or #dev?"
    author: specops-builder
    created: "2026-02-19T16:45:00Z"
---

Set up Slack webhook integration for sending blocker notifications
when agents encounter blocking issues.

## Notes

### 2026-02-17T08:00:00Z — sam [comment]

**Created manually**
Need this for the multi-channel notification requirement (KB-012).

### 2026-02-19T16:45:00Z — specops-builder [blocker]

**Blocker: Slack channel unknown**
Cannot proceed with webhook configuration. Need to know the target
Slack channel for blocker notifications. Options:
1. `#ops` -- general operations channel
2. `#dev` -- developer channel
3. New dedicated `#kanban-alerts` channel
```

### Validation Rules

- Card `id` MUST match the filename stem (e.g., card with `id: a1b2c3` is stored at `a1b2c3.md`)
- Card `column` value MUST match a column name defined in `board.yaml`
- Card `labels` values MUST each match a label name defined in `board.yaml`
- Card `updated` MUST be >= `created`
- If `blockers` is non-empty, the card is considered "blocked" for display purposes (KB-004)
- Each blocker `id` MUST be unique within the card's `blockers` list
- `specRef` MUST match `^[a-z0-9][a-z0-9\-\/]*$`, MUST NOT contain `..`, and resolved path MUST be within repo root (SEC-B-003)
- `ralphFeature` MUST match `^[a-z0-9][a-z0-9\-_]*$` (SEC-B-003)

---

## Column

Configuration for a single column on the board. Columns are embedded within `board.yaml` and represent SDLC pipeline phases.

### Fields

| Field | Type | Constraints | Description | Traces To |
|-------|------|-------------|-------------|-----------|
| name | string | NOT NULL, UNIQUE (within board), MAX(50) | Column display name | KB-001 |
| wipLimit | integer | NULL, MIN(1) | Work-in-progress limit (display-only, not enforced per BR-003) | BR-003 |
| done | boolean | NOT NULL, DEFAULT false | Whether this column represents completed work (triggers auto-archive timer) | BR-002 |
| description | string | NULL, MAX(200) | Tooltip/description for the column | -- |

### Default SDLC Columns (BR-001)

| Order | Name | wipLimit | done | Description |
|-------|------|----------|------|-------------|
| 0 | Backlog | null | false | Work items awaiting prioritization |
| 1 | Spec Creation | 3 | false | Requirements and schema design in progress |
| 2 | Spec Review | 2 | false | Specs awaiting human review |
| 3 | Building | 3 | false | Implementation in progress |
| 4 | Testing | 3 | false | Verification and test execution |
| 5 | Human Review | 2 | false | Awaiting human approval |
| 6 | Done | null | true | Completed work items |

### Notes

- Column ordering is determined by array position in `board.yaml`
- WIP limits are advisory only -- agents can exceed them (BR-003)
- The `done: true` flag marks columns whose cards are candidates for auto-archiving after `settings.autoArchiveDays`
- Custom boards may define different columns, but the default set aligns with SPECOPS SDLC phases (BR-001)

---

## Label

A tag that can be applied to cards for categorization and filtering. Labels are defined at the board level in `board.yaml`.

### Fields

| Field | Type | Constraints | Description | Traces To |
|-------|------|-------------|-------------|-----------|
| name | string | NOT NULL, UNIQUE (within board), MAX(30) | Label display name | KB-023 |
| color | string | NOT NULL, MATCH(^#[0-9a-fA-F]{6}$) | Hex color code for visual display | -- |

### Default Labels

| Name | Color | Purpose |
|------|-------|---------|
| bug | #e11d48 | Defect or regression |
| feature | #2563eb | New functionality |
| infra | #7c3aed | Infrastructure or tooling |
| docs | #059669 | Documentation |
| urgent | #dc2626 | Time-sensitive item |
| blocked | #f59e0b | Visually emphasize blocked state (auto-applied when blockers non-empty) |

### Notes

- Labels are referenced by `name` in card frontmatter, not by index or ID
- Adding or removing labels from `board.yaml` does not require updating existing cards (cards with removed labels simply display the name without color)
- The `blocked` label may be automatically applied/removed by tooling when `blockers` list changes, but this is a UI convention, not enforced at the schema level

---

## ProjectConfig

A single project entry within `projects.yaml`, which configures the cross-repo dashboard (UC-005). The `projects.yaml` file lives in the Kanban project's root (not inside `.kanban/`).

### Fields

| Field | Type | Constraints | Description | Traces To |
|-------|------|-------------|-------------|-----------|
| name | string | NOT NULL, UNIQUE, MAX(100) | Display name for the project | KB-013 |
| path | string | NOT NULL | Absolute filesystem path to the repo root | KB-013 |
| description | string | NULL, MAX(300) | Brief description of the project | -- |
| adapters | string[] | NOT NULL, DEFAULT [] | List of adapter names to use for enrichment (e.g., "ralph", "specops") | KB-002 |
| enabled | boolean | NOT NULL, DEFAULT true | Whether to include this project in the dashboard | -- |
| cmsUrl | string | NULL | URL of CMS instance for this project's live operations view (if applicable) | KB-016 |

### File Format: projects.yaml

```yaml
version: 1
projects:
  - name: AgentDispatch
    path: /Users/sam/src/AgentDispatch
    description: "Autonomous SDLC orchestrator"
    adapters:
      - ralph
      - specops
    enabled: true
    cmsUrl: "http://192.168.68.69:3000"

  - name: Vivian
    path: /Users/sam/src/Vivian
    description: "Voice AI assistant and comms layer"
    adapters:
      - ralph
      - specops
    enabled: true
    cmsUrl: null

  - name: SPECOPS
    path: /Users/sam/src/Skills/SPECOPS
    description: "Specification operations pipeline"
    adapters:
      - specops
    enabled: true
    cmsUrl: null

  - name: ChartFlow
    path: /Users/sam/src/ChartFlow
    description: "Mermaid diagram generation"
    adapters:
      - ralph
    enabled: true
    cmsUrl: null

  - name: CMS
    path: /Users/sam/src/CMS
    description: "Content management and ops dashboard"
    adapters:
      - ralph
      - specops
    enabled: true
    cmsUrl: null

  - name: PSCanvas
    path: /Users/sam/src/PSCanvas
    description: "Photoshop canvas automation"
    adapters: []
    enabled: false
    cmsUrl: null
```

### Validation Rules

- Every `path` MUST be an absolute filesystem path and MUST NOT contain `..` sequences (SEC-B-003)
- If a `path` does not exist at read time, the project is displayed as "offline" (KB-015)
- `adapters` values MUST be from the known adapter set: `ralph`, `specops`, `specArtifact`
- The `projects.yaml` file is read-only from the VS Code extension perspective; it is edited manually or via Claude Code skill

---

## Note

A timestamped entry appended to a card's Markdown body. Notes are not a separate file -- they are sections within the card `.md` file, below the `## Notes` heading.

### Fields

| Field | Type | Constraints | Description | Traces To |
|-------|------|-------------|-------------|-----------|
| timestamp | datetime | NOT NULL, ISO 8601 | When the note was created | KB-011 |
| author | string | NOT NULL, MAX(100) | Who wrote the note (agent ID or human name) | KB-011 |
| content | string (Markdown) | NOT NULL | Note body (free-form Markdown) | KB-005, KB-011 |
| type | string | NULL, ENUM(comment, milestone, blocker, unblock), DEFAULT 'comment' | Note category for filtering and display | KB-011 |

### Note Author Conventions

| Author Pattern | Source |
|----------------|--------|
| `sam` (or human name) | Human Developer adding context or unblocking |
| `agentdispatch` | AgentDispatch orchestrator |
| `specops-requirements` | SPECOPS requirements analyst agent |
| `specops-schemas` | SPECOPS schema designer agent |
| `specops-builder` | SPECOPS builder agent |
| `specops-verifier` | SPECOPS verification agent |
| `specops-security` | SPECOPS security reviewer agent |
| `vivian` | Vivian voice/comms assistant |
| `slack` | Slack adapter |

### Agent Milestone Note Format

Agent milestone notes follow a structured format for consistency:

```markdown
### 2026-02-19T09:15:00Z — specops-requirements [milestone]

**Phase: Spec Creation Complete**
- Created: `specs/feature-name/requirements.md`
- Created: `specs/feature-name/schemas.md`
- Open questions: 2 (see `specs/feature-name/open-questions.md`)
```

The `**Phase: {phase name}**` line identifies the SDLC milestone. Common phases:
- `Card Created`
- `Spec Creation Complete`
- `Spec Review Approved`
- `Building Started`
- `Building Complete`
- `Testing Started`
- `Testing Passed` / `Testing Failed`
- `Human Review Requested`
- `Human Review Approved`
- `Archived`

### Human Note Format

Human notes are free-form but follow the same heading convention:

```markdown
### 2026-02-20T11:00:00Z — sam [comment]

Use the `#ops` channel for blocker notifications. Also, make sure
the webhook URL is stored in environment variables, not hard-coded.
```

### Blocker Resolution Note Format

When a blocker is resolved, a note records the resolution:

```markdown
### 2026-02-20T11:05:00Z — sam [unblock]

**Blocker Resolved: blk-x1y2**
Answer: Use `#ops` channel for all blocker notifications.
```

---

## Directory Structure

The complete `.kanban/` directory structure for a single repository:

```
.kanban/
  board.yaml              # Board configuration (columns, labels, cardOrder, settings)
  cards/
    a1b2c3.md             # Active card files
    d4e5f6.md
    g7h8i9.md
  archive/
    x1y2z3.md             # Auto-archived cards (moved from cards/ after N days in Done)
```

The `projects.yaml` file for cross-repo dashboard lives at the Kanban project root:

```
Kanban/
  projects.yaml           # Cross-repo project configuration
  specs/
    kanban-dashboard/
      requirements.md
      schemas.md           # This file
      state-machines.md
  .kanban/
    board.yaml             # Kanban project's own board
    cards/
    archive/
```

---

## Archive Behavior (BR-002)

- Cards in any column where `done: true` for longer than `settings.autoArchiveDays` are moved from `.kanban/cards/` to `.kanban/archive/`
- The card file itself is unchanged -- only its filesystem location changes
- The card ID is removed from `board.yaml` `cardOrder`
- Cards with `pin: true` in frontmatter are never auto-archived regardless of time in Done
- Archived cards can be restored by moving the file back to `cards/` and adding the ID to `cardOrder`
- The archive check runs on board load (VS Code extension) and on AgentDispatch heartbeat

---

## ID Generation (KB-008)

Card IDs are 6-character lowercase alphanumeric strings matching `^[a-z0-9]{6}$`.

- **Character set**: `abcdefghijklmnopqrstuvwxyz0123456789` (36 characters)
- **Total keyspace**: 36^6 = 2,176,782,336 (~2.1 billion unique IDs)
- **Collision avoidance**: Generator MUST check existing card filenames in `.kanban/cards/` and `.kanban/archive/` before assigning
- **Generation method**: Cryptographically random selection from the character set (not sequential)

Blocker IDs follow the pattern `^blk-[a-z0-9]{4}$` with the same generation approach but a `blk-` prefix and 4-character suffix (1,679,616 unique IDs per card).
