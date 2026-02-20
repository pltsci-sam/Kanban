# Kanban Dashboard — API Contracts

**Spec:** kanban-dashboard
**Type:** fullstack
**Date:** 2026-02-20
**Status:** Draft

---

## Table of Contents

1. [Core Data Models (TypeScript Interfaces)](#1-core-data-models)
2. [VS Code Extension <-> File System (Internal API)](#2-vs-code-extension--file-system-internal-api)
3. [Claude Code Skill Commands (CLI Interface)](#3-claude-code-skill-commands-cli-interface)
4. [AgentDispatch -> .kanban/ (File I/O Protocol)](#4-agentdispatch---kanban-file-io-protocol)
5. [CMS Dashboard <- AgentDispatch (Consumed API)](#5-cms-dashboard--agentdispatch-consumed-api)
6. [Vivian -> .kanban/ (File I/O Protocol)](#6-vivian---kanban-file-io-protocol)
7. [Adapter Interfaces](#7-adapter-interfaces)

---

## 1. Core Data Models

All consumers (VS Code extension, Claude Code skill, AgentDispatch, Vivian, adapters) share these canonical TypeScript interfaces. These define the in-memory representations parsed from the `.kanban/` file system.

### 1.1 Board Model (parsed from `board.yaml`)

```typescript
interface Board {
  name: string;                    // Board display name — min: 1, max: 100
  description?: string;            // Optional board description — max: 500
  version: 1;                      // Schema version — always 1
  columns: ColumnDefinition[];     // Ordered SDLC columns — min: 1, max: 20
  labels: LabelDefinition[];       // Available label palette — max: 50
  cardOrder: Record<string, string[]>;
    // Map of column name -> ordered card IDs
    // Keys MUST match a column.name in columns[]
    // Values are arrays of card IDs (6-char alphanumeric)
  settings: BoardSettings;
}

interface ColumnDefinition {
  name: string;                    // Column identifier and display name — min: 1, max: 50
  wipLimit?: number;               // Visual WIP limit (not enforced) — range: [1, 100]
  done?: boolean;                  // If true, column represents completed work — default: false
  description?: string;            // Column tooltip description — max: 200
}

interface LabelDefinition {
  name: string;                    // Label text — min: 1, max: 30
  color: string;                   // CSS color value — pattern: ^#[0-9a-fA-F]{6}$
}

interface BoardSettings {
  autoArchiveDays: number;         // Days in Done before auto-archive — range: [1, 365], default: 30
  defaultPriority: CardPriority;   // Default priority for new cards — default: "medium"
  defaultColumn: string;           // Column for new cards — must match a column.name
  idFormat: "alphanumeric6";       // Card ID generation strategy — enum: alphanumeric6
}
```

### 1.2 Card Model (parsed from `.kanban/cards/{id}.md` frontmatter + body)

```typescript
interface Card {
  // --- YAML frontmatter fields ---
  id: string;                      // 6-char lowercase alphanumeric — pattern: ^[a-z0-9]{6}$
  title: string;                   // Card title — min: 1, max: 200
  column: string;                  // Current column name — must match a Board.columns[].name
  priority: CardPriority;          // Priority level — enum: critical, high, medium, low
  labels: string[];                // Label names from board palette — max: 10
  assignee?: string;               // Agent or human identifier — max: 50
  created: string;                 // ISO 8601 timestamp — set once at creation
  updated: string;                 // ISO 8601 timestamp — refreshed on every write
  due?: string;                    // ISO 8601 date (YYYY-MM-DD) — optional deadline
  source: CardSource;              // Origin of the card — enum: manual, agentdispatch, vivian, slack
  pin?: boolean;                   // If true, never auto-archive — default: false
  blockers: Blocker[];             // Active blockers — empty array if unblocked
  specRef?: string;                // Reference to specs/{feature}/ directory — max: 100
  ralphFeature?: string;           // Reference to .ralph/features.json key — max: 100
  meeting?: string;                // Meeting title (if source: vivian) — max: 200

  // --- Markdown body ---
  description: string;             // Card description (markdown body before first note)
  notes: Note[];                   // Appended notes (parsed from markdown body sections)
}

type CardPriority = "critical" | "high" | "medium" | "low";

type CardSource = "manual" | "agentdispatch" | "vivian" | "slack";

interface Blocker {
  id: string;                      // Blocker identifier — pattern: ^blk-[a-z0-9]{4}$
  question: string;                // What the agent needs answered — min: 1, max: 500
  author: string;                  // Who created the blocker — max: 50
  created: string;                 // ISO 8601 timestamp
}

interface Note {
  timestamp: string;               // ISO 8601 timestamp
  author: string;                  // Agent ID, "human", or "vivian" — max: 50
  content: string;                 // Markdown content of the note
  type?: NoteType;                 // Note category — enum: comment, milestone, blocker, unblock
}

type NoteType = "comment" | "milestone" | "blocker" | "unblock";
```

### 1.3 Card File Format (on-disk representation)

Cards are stored as markdown files with YAML frontmatter. This is the canonical file format all writers MUST produce and all readers MUST parse.

```markdown
---
id: a1b2c3
title: "Implement user authentication"
column: Building
priority: high
labels: [security, backend]
assignee: specops-builder
created: "2026-02-20T10:30:00Z"
updated: "2026-02-20T14:15:00Z"
due: "2026-03-01"
source: agentdispatch
pin: false
blockers: []
specRef: user-auth
ralphFeature: user-auth
---

Implement JWT-based authentication with refresh token rotation.

## Notes

### 2026-02-20T12:00:00Z — specops-analyst [milestone]

Spec creation complete. Created requirements.md and open-questions.md.
Files: specs/user-auth/requirements.md, specs/user-auth/open-questions.md

### 2026-02-20T14:15:00Z — specops-builder [milestone]

Build phase started. Scaffolded auth module.
Files: src/auth/index.ts, src/auth/jwt.ts
```

### 1.4 Board YAML Format (on-disk representation)

```yaml
name: "AIFactory SDLC"
version: 1
columns:
  - name: Backlog
    description: "Work items waiting to be started"
  - name: "Spec Creation"
    wipLimit: 3
    description: "Requirements and schema design in progress"
  - name: "Spec Review"
    wipLimit: 2
    description: "Specs awaiting human review"
  - name: Building
    wipLimit: 3
    description: "Implementation in progress"
  - name: Testing
    wipLimit: 3
    description: "Verification and testing in progress"
  - name: "Human Review"
    wipLimit: 2
    description: "Awaiting human sign-off"
  - name: Done
    done: true
    description: "Completed work"
labels:
  - name: security
    color: "#e74c3c"
  - name: backend
    color: "#3498db"
  - name: frontend
    color: "#2ecc71"
  - name: infra
    color: "#9b59b6"
  - name: bug
    color: "#e67e22"
  - name: spec
    color: "#1abc9c"
cardOrder:
  Backlog: [a1b2c3, d4e5f6]
  Spec Creation: [g7h8i9]
  Spec Review: []
  Building: [j0k1l2]
  Testing: []
  Human Review: []
  Done: [m3n4o5]
settings:
  autoArchiveDays: 30
  defaultPriority: medium
  defaultColumn: Backlog
  idFormat: alphanumeric6
```

### 1.5 Projects Config (parsed from `projects.yaml`)

```typescript
interface ProjectsConfig {
  projects: ProjectConfig[];
}

interface ProjectConfig {
  name: string;                    // Project display name — min: 1, max: 100
  path: string;                    // Absolute path to repo root — must exist on disk
  description?: string;            // Brief description of the project — max: 300
  adapters: AdapterType[];         // Enabled adapters — enum values from AdapterType
  enabled: boolean;                // Whether to include in dashboard — default: true
  cmsUrl?: string;                 // URL of CMS instance for live ops view
}

type AdapterType = "ralph" | "specops" | "specArtifact";
```

### 1.6 Enriched Card (display-time composition)

```typescript
interface EnrichedCard extends Card {
  enrichment: CardEnrichment;
}

interface CardEnrichment {
  ralph?: RalphEnrichment;
  specops?: SpecopsEnrichment;
  specArtifact?: SpecArtifactEnrichment;
}

interface RalphEnrichment {
  buildProgress?: number;          // 0-100 percentage
  phase?: string;                  // Current ralph phase
  filesModified?: number;          // Count of files touched
}

interface SpecopsEnrichment {
  specPhase?: string;              // Current specops phase
  completedPhases?: string[];      // Phases marked done
  lastActivity?: string;           // ISO 8601 timestamp
}

interface SpecArtifactEnrichment {
  openQuestionCount?: number;      // Count of unresolved questions
  decisionCount?: number;          // Count of recorded decisions
  hasRequirements?: boolean;       // Whether requirements.md exists
  hasSchema?: boolean;             // Whether schemas.md exists
}
```

---

## 2. VS Code Extension <-> File System (Internal API)

The VS Code extension communicates with the kanban board exclusively through file system operations. There is no HTTP server or IPC — the file system IS the API.

**Use Cases:** UC-001, UC-002, UC-005, UC-007, UC-008

### 2.1 BoardReader — Read Board State

Reads `board.yaml` and all card files to produce an in-memory board representation.

```typescript
interface BoardReader {
  /**
   * Parse board.yaml and all cards into an in-memory Board + Card[] structure.
   * Traces to: UC-001 step 2, UC-005 step 3
   *
   * @param boardDir - Absolute path to .kanban/ directory
   * @returns Parsed board with all cards, or error
   * @throws BoardNotFoundError if .kanban/board.yaml does not exist
   * @throws BoardValidationError if board.yaml fails schema validation
   */
  readBoard(boardDir: string): Promise<BoardState>;

  /**
   * Read a single card file by ID.
   * Traces to: UC-002 step 3
   *
   * @param boardDir - Absolute path to .kanban/ directory
   * @param cardId - 6-char alphanumeric card ID — pattern: ^[a-z0-9]{6}$
   * @returns Parsed card, or null if file does not exist
   * @throws CardParseError if frontmatter is malformed
   */
  readCard(boardDir: string, cardId: string): Promise<Card | null>;

  /**
   * Watch .kanban/ for file changes and emit events.
   * Traces to: UC-001 (live updates when agents modify files)
   *
   * @param boardDir - Absolute path to .kanban/ directory
   * @param callback - Called on any change to board.yaml or cards/
   * @returns Disposable to stop watching
   */
  watch(boardDir: string, callback: (event: BoardChangeEvent) => void): Disposable;
}

interface BoardState {
  board: Board;                    // Parsed board.yaml
  cards: Card[];                   // All parsed card files
  errors: CardParseError[];        // Cards that failed to parse (skipped)
}

interface BoardChangeEvent {
  type: "board_updated" | "card_created" | "card_updated" | "card_deleted";
  path: string;                    // Absolute path to changed file
  cardId?: string;                 // Card ID if type is card_*
  timestamp: string;               // ISO 8601 timestamp of change detection
}

interface CardParseError {
  cardId: string;                  // Filename (without .md)
  path: string;                    // Absolute file path
  message: string;                 // Human-readable parse error
}
```

**Error Conditions:**

| Error | Condition | Recovery |
|-------|-----------|----------|
| `BoardNotFoundError` | `.kanban/board.yaml` does not exist | Extension shows empty state with "Initialize Board" button (AF-001.1) |
| `BoardValidationError` | `board.yaml` fails schema validation | Extension shows error + "Open in editor" action (EF-001.1) |
| `CardParseError` | Card `.md` file has malformed frontmatter | Skip card, log warning, show count indicator (EF-001.2) |

### 2.2 CardWriter — Create, Update, Delete Cards

Writes card files and updates `board.yaml` cardOrder. All writes use atomic write-then-rename.

```typescript
interface CardWriter {
  /**
   * Create a new card file and add its ID to board.yaml cardOrder.
   * Traces to: UC-007 steps 4-6
   *
   * @param boardDir - Absolute path to .kanban/ directory
   * @param card - Card data (id will be generated if not provided)
   * @returns Created card with generated ID
   * @throws ColumnNotFoundError if card.column is not in board.yaml columns
   * @throws CardExistsError if a card with the same ID already exists
   */
  createCard(boardDir: string, card: CardCreateInput): Promise<Card>;

  /**
   * Update an existing card's frontmatter and/or body.
   * Traces to: UC-002 steps 6-7, UC-008 steps 2-4
   *
   * @param boardDir - Absolute path to .kanban/ directory
   * @param cardId - 6-char card ID — pattern: ^[a-z0-9]{6}$
   * @param updates - Partial card fields to merge
   * @returns Updated card
   * @throws CardNotFoundError if card file does not exist
   * @throws ColumnNotFoundError if updates.column is not in board.yaml columns
   */
  updateCard(boardDir: string, cardId: string, updates: CardUpdateInput): Promise<Card>;

  /**
   * Move a card between columns (updates card frontmatter + board.yaml cardOrder).
   * Traces to: UC-008 steps 2-4
   *
   * @param boardDir - Absolute path to .kanban/ directory
   * @param cardId - 6-char card ID — pattern: ^[a-z0-9]{6}$
   * @param targetColumn - Target column name — must match Board.columns[].name
   * @param position - Index in target column's cardOrder — default: append to end
   * @returns Updated card
   * @throws CardNotFoundError if card file does not exist
   * @throws ColumnNotFoundError if targetColumn is not in board.yaml columns
   */
  moveCard(boardDir: string, cardId: string, targetColumn: string, position?: number): Promise<Card>;

  /**
   * Append a note to a card's markdown body.
   * Traces to: UC-002 step 4
   *
   * @param boardDir - Absolute path to .kanban/ directory
   * @param cardId - 6-char card ID — pattern: ^[a-z0-9]{6}$
   * @param note - Note to append
   * @returns Updated card
   * @throws CardNotFoundError if card file does not exist
   */
  appendNote(boardDir: string, cardId: string, note: NoteInput): Promise<Card>;

  /**
   * Delete a card file and remove its ID from board.yaml cardOrder.
   * Traces to: archival flow
   *
   * @param boardDir - Absolute path to .kanban/ directory
   * @param cardId - 6-char card ID — pattern: ^[a-z0-9]{6}$
   * @throws CardNotFoundError if card file does not exist
   */
  deleteCard(boardDir: string, cardId: string): Promise<void>;

  /**
   * Move a card file from cards/ to archive/ and remove from board.yaml cardOrder.
   * Traces to: BR-002
   *
   * @param boardDir - Absolute path to .kanban/ directory
   * @param cardId - 6-char card ID — pattern: ^[a-z0-9]{6}$
   * @throws CardNotFoundError if card file does not exist
   */
  archiveCard(boardDir: string, cardId: string): Promise<void>;

  /**
   * Generate a unique 6-char alphanumeric card ID.
   * Traces to: KB-008
   *
   * @param boardDir - Absolute path to .kanban/ directory (to check for collisions)
   * @returns Unique ID — pattern: ^[a-z0-9]{6}$
   */
  generateId(boardDir: string): Promise<string>;
}

interface CardCreateInput {
  title: string;                   // Card title — min: 1, max: 200
  column?: string;                 // Target column — default: board.settings.defaultColumn
  priority?: CardPriority;         // Priority — default: "medium"
  labels?: string[];               // Labels — default: []
  assignee?: string;               // Assignee — default: undefined
  description?: string;            // Card body markdown — default: ""
  source: CardSource;              // Origin — required
  due?: string;                    // Deadline ISO date — optional
  specRef?: string;                // Spec directory reference — optional
  ralphFeature?: string;           // Ralph feature key — optional
  meeting?: string;                // Meeting title (if source: vivian) — optional
  blockers?: Blocker[];            // Initial blockers — default: []
}

interface CardUpdateInput {
  title?: string;                  // Updated title — min: 1, max: 200
  column?: string;                 // Move to column — must match Board.columns[].name
  priority?: CardPriority;         // Updated priority
  labels?: string[];               // Replace labels array
  assignee?: string | null;        // Updated assignee (null to clear)
  due?: string | null;             // Updated deadline (null to clear)
  pin?: boolean;                   // Pin/unpin
  blockers?: Blocker[];            // Replace blockers array
  description?: string;            // Replace description body
}

interface NoteInput {
  author: string;                  // Note author — max: 50
  content: string;                 // Markdown content — min: 1
  type?: NoteType;                 // Note category — default: "comment"
}
```

**Atomic Write Protocol:**

All file writes MUST follow the write-then-rename pattern (NFR-002):

```
1. Write content to .kanban/cards/{id}.md.tmp
2. fsync the temp file
3. Rename .kanban/cards/{id}.md.tmp -> .kanban/cards/{id}.md
4. If board.yaml also needs updating:
   a. Write content to .kanban/board.yaml.tmp
   b. fsync the temp file
   c. Rename .kanban/board.yaml.tmp -> .kanban/board.yaml
```

### 2.3 BoardInitializer — Create Default Board

```typescript
interface BoardInitializer {
  /**
   * Create .kanban/ directory with default SDLC board.yaml and empty cards/.
   * Traces to: AF-001.1, AF-003.3
   *
   * @param repoRoot - Absolute path to repo root directory
   * @returns Path to created .kanban/ directory
   * @throws BoardExistsError if .kanban/ already exists
   */
  initialize(repoRoot: string): Promise<string>;
}
```

Default board.yaml created by `initialize()` uses the SDLC columns defined in BR-001 with the settings shown in section 1.4.

### 2.4 Adapter Interfaces (Extension-Side)

See [Section 7: Adapter Interfaces](#7-adapter-interfaces) for full adapter definitions. The extension calls these at render time to compose `EnrichedCard` objects.

```typescript
interface AdapterRegistry {
  /**
   * Run all configured adapters and return enrichment data for all cards.
   * Traces to: UC-001 step 4
   *
   * @param repoRoot - Absolute path to repo root
   * @param cards - Cards to enrich
   * @param enabledAdapters - Which adapters to run (from ProjectConfig.adapters)
   * @returns Map of cardId -> CardEnrichment
   */
  enrichCards(
    repoRoot: string,
    cards: Card[],
    enabledAdapters: AdapterType[]
  ): Promise<Map<string, CardEnrichment>>;
}
```

---

## 3. Claude Code Skill Commands (CLI Interface)

The kanban skill is a Claude Code slash command that operates on `.kanban/` files. Each command reads and/or writes files following the same file format contracts defined in Section 1. The skill has no network dependencies — it is purely file I/O.

**Use Cases:** UC-007, UC-008

### 3.1 `kanban init` — Initialize Board

**Description:** Create `.kanban/` directory with default SDLC board configuration.
**Traces to:** AF-001.1, AF-003.3, KB-022

```
Usage:  kanban init [--name <board-name>]

Options:
  --name <board-name>     Board display name — default: repo directory name
                          Constraint: min 1, max 100 chars

Behavior:
  1. Check if .kanban/ exists in current working directory
  2. If exists: print error "Board already exists at .kanban/" and exit 1
  3. Create directory structure:
     .kanban/
     .kanban/board.yaml        (default SDLC columns per BR-001)
     .kanban/cards/             (empty directory)
     .kanban/archive/           (empty directory)
  4. Print "Initialized kanban board: {name}"

Exit Codes:
  0 — Board created successfully
  1 — Board already exists or write failure
```

**Output on success:**
```
Initialized kanban board: AIFactory SDLC
Created .kanban/board.yaml with 7 columns: Backlog, Spec Creation, Spec Review, Building, Testing, Human Review, Done
```

### 3.2 `kanban add` — Create Card

**Description:** Create a new card in the specified column.
**Traces to:** UC-007, KB-022, KB-023

```
Usage:  kanban add <title> [options]

Arguments:
  <title>                  Card title — min: 1, max: 200 chars (required)

Options:
  --col <column>           Target column name — default: board.settings.defaultColumn
                           Constraint: must match a column in board.yaml
  --priority <p>           Priority level — enum: critical, high, medium, low — default: medium
  --label <l>              Label name (repeatable) — must exist in board.yaml labels
                           Example: --label security --label backend
  --assignee <name>        Assignee identifier — max: 50 chars
  --due <YYYY-MM-DD>       Deadline date — ISO 8601 date format
  --desc <text>            Card description body — max: 2000 chars
  --spec-ref <dir>         Reference to specs/ subdirectory
  --ralph-feature <key>    Reference to .ralph/features.json key

Behavior:
  1. Read and validate board.yaml
  2. Generate unique 6-char alphanumeric card ID
  3. Write .kanban/cards/{id}.md with frontmatter + description body
     - source: "manual"
     - created/updated: current ISO 8601 timestamp
     - blockers: []
  4. Append card ID to target column in board.yaml cardOrder
  5. Write board.yaml (atomic rename)
  6. Print card summary

Exit Codes:
  0 — Card created successfully
  1 — Validation error (bad column, missing board, etc.)
```

**Output on success:**
```
Created card [a1b2c3] "Implement user authentication"
  Column: Backlog | Priority: high | Labels: security, backend
```

### 3.3 `kanban move` — Move Card to Column

**Description:** Move a card to a different column.
**Traces to:** UC-008, KB-010

```
Usage:  kanban move <id> <column>

Arguments:
  <id>                     Card ID — pattern: ^[a-z0-9]{6}$ (required)
  <column>                 Target column name — must match board.yaml column (required)

Behavior:
  1. Read board.yaml and card file
  2. Validate card exists and target column exists
  3. Update card frontmatter: column = target, updated = now
  4. Move card ID in board.yaml cardOrder from old column to new column (append)
  5. Write card file and board.yaml (atomic renames)
  6. Print move confirmation

Exit Codes:
  0 — Card moved successfully
  1 — Card not found, column not found, or write failure
```

**Output on success:**
```
Moved [a1b2c3] "Implement user authentication"
  Spec Creation -> Building
```

### 3.4 `kanban done` — Mark Card as Done

**Description:** Move a card to the Done column (shortcut for `kanban move <id> Done`).
**Traces to:** UC-008

```
Usage:  kanban done <id>

Arguments:
  <id>                     Card ID — pattern: ^[a-z0-9]{6}$ (required)

Behavior:
  1. Find the column with done: true in board.yaml (default: "Done")
  2. Execute the same logic as `kanban move <id> <done-column>`
  3. Print done confirmation

Exit Codes:
  0 — Card moved to Done
  1 — Card not found, no done column configured, or write failure
```

**Output on success:**
```
Completed [a1b2c3] "Implement user authentication"
  Building -> Done
```

### 3.5 `kanban list` — List Cards

**Description:** List cards on the board, optionally filtered.
**Traces to:** UC-001, KB-022

```
Usage:  kanban list [options]

Options:
  --col <column>           Filter by column name — must match board.yaml column
  --blocked                Show only cards with non-empty blockers array
  --priority <p>           Filter by priority — enum: critical, high, medium, low
  --label <l>              Filter by label (repeatable, OR logic)
  --assignee <name>        Filter by assignee
  --format <fmt>           Output format — enum: table, json — default: table

Behavior:
  1. Read board.yaml and all card files
  2. Apply filters (intersection of all provided filters)
  3. Sort: by column order (board.yaml columns), then by position in cardOrder
  4. Print results in requested format

Exit Codes:
  0 — List printed (even if empty)
  1 — Board not found or parse error
```

**Output (table format):**
```
Backlog (2)
  [a1b2c3] high  Implement user authentication    security, backend
  [d4e5f6] med   Add logging middleware            infra

Spec Creation (1)
  [g7h8i9] med   Design notification schema        spec

Building (1)
  [j0k1l2] high  Build payment gateway             backend        BLOCKED

Done (1)
  [m3n4o5] low   Update README                     —
```

**Output (json format):**
```json
{
  "cards": [
    {
      "id": "a1b2c3",
      "title": "Implement user authentication",
      "column": "Backlog",
      "priority": "high",
      "labels": ["security", "backend"],
      "assignee": null,
      "blocked": false,
      "created": "2026-02-20T10:30:00Z",
      "updated": "2026-02-20T14:15:00Z"
    }
  ],
  "total": 5
}
```

### 3.6 `kanban show` — Show Card Details

**Description:** Display full card details including notes and enrichment data.
**Traces to:** UC-002, KB-005

```
Usage:  kanban show <id>

Arguments:
  <id>                     Card ID — pattern: ^[a-z0-9]{6}$ (required)

Behavior:
  1. Read card file
  2. Read adapter data sources for enrichment (best-effort, skip if unavailable)
  3. Print full card details including all notes

Exit Codes:
  0 — Card displayed
  1 — Card not found or parse error
```

**Output on success:**
```
Card [a1b2c3] — Implement user authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Column:    Building
Priority:  high
Labels:    security, backend
Assignee:  specops-builder
Created:   2026-02-20T10:30:00Z
Updated:   2026-02-20T14:15:00Z
Due:       2026-03-01
Source:    agentdispatch
Spec:      specs/user-auth/
Ralph:     user-auth (build progress: 45%)

Blockers: none

Description:
  Implement JWT-based authentication with refresh token rotation.

Notes (2):
  [2026-02-20T12:00:00Z] specops-analyst (milestone)
    Spec creation complete. Created requirements.md and open-questions.md.

  [2026-02-20T14:15:00Z] specops-builder (milestone)
    Build phase started. Scaffolded auth module.
```

### 3.7 `kanban archive` — Archive Old Done Cards

**Description:** Move cards in the Done column older than N days to the archive directory.
**Traces to:** BR-002, KB-022

```
Usage:  kanban archive [options]

Options:
  --days <n>               Days since last update before archiving — default: board.settings.autoArchiveDays
                           Constraint: range [1, 365]
  --dry-run                Print what would be archived without making changes

Behavior:
  1. Read board.yaml and all cards in the Done column
  2. Filter cards where (now - card.updated) > N days AND card.pin !== true
  3. For each matching card:
     a. Move .kanban/cards/{id}.md to .kanban/archive/{id}.md
     b. Remove card ID from board.yaml cardOrder Done list
  4. Write updated board.yaml (atomic rename)
  5. Print archive summary

Exit Codes:
  0 — Archive completed (or dry-run printed)
  1 — Board not found or write failure
```

**Output on success:**
```
Archived 3 cards (older than 30 days):
  [m3n4o5] "Update README" (45 days in Done)
  [p6q7r8] "Fix typo in config" (32 days in Done)
  [s9t0u1] "Add health check" (38 days in Done)

Skipped 1 pinned card:
  [v2w3x4] "Core architecture decisions" (pin: true)
```

### 3.8 `kanban validate` — Validate Board Integrity

**Description:** Check `board.yaml` and all card files against schema. Report any integrity issues.
**Traces to:** EF-001.1, EF-001.2

```
Usage:  kanban validate

Behavior:
  1. Check .kanban/ directory exists
  2. Validate board.yaml against Board schema (section 1.1)
  3. For each file in .kanban/cards/:
     a. Validate filename matches pattern: ^[a-z0-9]{6}\.md$
     b. Parse and validate frontmatter against Card schema (section 1.2)
     c. Validate card.column matches a board column name
     d. Validate card.labels are subset of board labels
  4. Cross-reference: every card ID in board.yaml cardOrder has a matching file
  5. Cross-reference: every card file has its ID in board.yaml cardOrder
  6. Check for duplicate card IDs across all cardOrder lists
  7. Print validation report

Exit Codes:
  0 — All validations passed
  1 — One or more validation errors found
```

**Output (errors found):**
```
Validation Results
━━━━━━━━━━━━━━━━━
board.yaml:
  ERROR: cardOrder references card "x1y2z3" but no file exists at cards/x1y2z3.md
  ERROR: cardOrder column "Staging" does not match any defined column

cards/a1b2c3.md:
  WARNING: card column "Buildng" does not match any board column (typo?)

cards/bad-name.md:
  ERROR: filename does not match expected pattern ^[a-z0-9]{6}\.md$

Orphan cards (file exists but not in cardOrder):
  WARNING: cards/d4e5f6.md is not referenced in any cardOrder list

Summary: 3 errors, 2 warnings
```

---

## 4. AgentDispatch -> .kanban/ (File I/O Protocol)

AgentDispatch reads and writes `.kanban/` files directly on the NUC filesystem. There is no HTTP API between AgentDispatch and the kanban board. This section defines the protocol AgentDispatch follows for file I/O operations.

**Use Cases:** UC-003, UC-004
**Confirmed by:** A-007 (AgentDispatch reads/writes .kanban/ files directly via file I/O)

### 4.1 Reading Board State

**Traces to:** UC-003 step 1, UC-004 step 1

AgentDispatch reads board state during its heartbeat cycle to discover available work and check for unblocked cards.

```typescript
interface AgentDispatchBoardReader {
  /**
   * Read full board state from a repo's .kanban/ directory.
   * Called during HeartbeatService tick.
   *
   * @param repoPath - Absolute path to repo root (from projects config)
   * @returns BoardState or null if .kanban/ does not exist
   */
  readBoardState(repoPath: string): Promise<BoardState | null>;

  /**
   * Read a specific card by ID.
   *
   * @param repoPath - Absolute path to repo root
   * @param cardId - 6-char card ID
   * @returns Card or null
   */
  readCard(repoPath: string, cardId: string): Promise<Card | null>;
}
```

**Heartbeat Read Sequence:**
```
1. HeartbeatService tick fires
2. For each configured repo path:
   a. Read {repoPath}/.kanban/board.yaml (parse YAML)
   b. Read all files in {repoPath}/.kanban/cards/ (parse frontmatter + body)
   c. Build in-memory BoardState
3. Identify actionable cards:
   - Cards in Backlog with no assignee (available for pickup)
   - Cards with empty blockers that were previously blocked (unblocked, resume work)
   - Cards in columns matching agent capabilities
4. Dispatch work to available agents
```

### 4.2 Creating Cards

**Traces to:** UC-003 steps 2-5, KB-007, KB-008, KB-009

```typescript
interface AgentDispatchCardWriter {
  /**
   * Create a new kanban card. Generates ID, writes card file,
   * updates board.yaml, and commits to git.
   *
   * @param repoPath - Absolute path to repo root
   * @param input - Card creation data
   * @returns Created card
   */
  createCard(repoPath: string, input: AgentCardCreateInput): Promise<Card>;
}

interface AgentCardCreateInput {
  title: string;                   // Card title — min: 1, max: 200
  column?: string;                 // Target column — default: "Backlog"
  priority: CardPriority;          // Priority level — required
  labels?: string[];               // Labels — default: []
  description?: string;            // Card body — default: ""
  source: "agentdispatch" | "vivian" | "slack";
                                   // Origin — "manual" not valid for agents
  specRef?: string;                // specs/ directory reference
  ralphFeature?: string;           // .ralph/ feature key
  meeting?: string;                // Meeting title (if source: vivian)
}
```

**Card Creation Sequence:**
```
1. Generate 6-char alphanumeric ID:
   a. Generate random string matching ^[a-z0-9]{6}$
   b. Check no file exists at .kanban/cards/{id}.md
   c. If collision, regenerate (max 5 retries)
2. Build card frontmatter YAML:
   - id, title, column, priority, labels, source
   - created: current UTC ISO 8601
   - updated: current UTC ISO 8601
   - blockers: []
   - Additional fields: assignee, specRef, ralphFeature, meeting
3. Write card file (atomic):
   a. Write to .kanban/cards/{id}.md.tmp
   b. fsync
   c. Rename .kanban/cards/{id}.md.tmp -> .kanban/cards/{id}.md
4. Update board.yaml (atomic):
   a. Read current board.yaml
   b. Append card ID to cardOrder[column]
   c. Write to .kanban/board.yaml.tmp
   d. fsync
   e. Rename .kanban/board.yaml.tmp -> .kanban/board.yaml
5. Git commit (see section 4.6)
```

### 4.3 Moving Cards Between Columns

**Traces to:** UC-004 steps 2-6, KB-010, KB-011

```typescript
interface AgentDispatchCardMover {
  /**
   * Move a card to the next SDLC column. Updates card frontmatter,
   * appends milestone note, updates board.yaml, and commits.
   *
   * @param repoPath - Absolute path to repo root
   * @param cardId - 6-char card ID
   * @param targetColumn - Destination column name
   * @param milestone - Milestone note to append (phase summary)
   * @returns Updated card
   */
  moveCard(
    repoPath: string,
    cardId: string,
    targetColumn: string,
    milestone: MilestoneNote
  ): Promise<Card>;
}

interface MilestoneNote {
  author: string;                  // Agent identifier — max: 50
  phaseName: string;               // SDLC phase completed — e.g., "Spec Creation"
  summary: string;                 // Phase completion summary — min: 1, max: 1000
  filesModified?: string[];        // List of files created/modified — max: 50 items
  testResults?: TestResultSummary; // Test results if applicable
}

interface TestResultSummary {
  passed: number;                  // Count of passing tests
  failed: number;                  // Count of failing tests
  skipped: number;                 // Count of skipped tests
}
```

**Card Move Sequence:**
```
1. Read current card from .kanban/cards/{id}.md
2. Read current board.yaml
3. Validate:
   a. Card exists
   b. Target column exists in board.yaml columns
   c. Card is currently in a different column
4. Update card frontmatter:
   a. column = targetColumn
   b. updated = current UTC ISO 8601
5. Append milestone note to card body:
   ### {timestamp} — {author} [milestone]

   {phaseName} complete. {summary}
   Files: {comma-separated file list}
   Tests: {passed} passed, {failed} failed, {skipped} skipped
6. Write card file (atomic write-then-rename)
7. Update board.yaml cardOrder:
   a. Remove card ID from cardOrder[oldColumn]
   b. Append card ID to cardOrder[targetColumn]
8. Write board.yaml (atomic write-then-rename)
9. Git commit (see section 4.6)
```

### 4.4 Adding Blockers and Notes

**Traces to:** AF-004.1, KB-011, KB-012

```typescript
interface AgentDispatchBlockerWriter {
  /**
   * Add a blocker to a card. Card stays in current column.
   * Triggers multi-channel notification (Slack, Vivian).
   *
   * @param repoPath - Absolute path to repo root
   * @param cardId - 6-char card ID
   * @param blocker - Blocker to add
   * @returns Updated card
   */
  addBlocker(repoPath: string, cardId: string, blocker: BlockerInput): Promise<Card>;

  /**
   * Remove a blocker from a card and append unblock note.
   *
   * @param repoPath - Absolute path to repo root
   * @param cardId - 6-char card ID
   * @param blockerId - Blocker ID to remove — pattern: ^blk-[a-z0-9]{4}$
   * @param resolution - Human's answer / resolution text
   * @returns Updated card
   */
  removeBlocker(
    repoPath: string,
    cardId: string,
    blockerId: string,
    resolution: string
  ): Promise<Card>;

  /**
   * Append a generic note to a card without changing state.
   *
   * @param repoPath - Absolute path to repo root
   * @param cardId - 6-char card ID
   * @param note - Note to append
   * @returns Updated card
   */
  appendNote(repoPath: string, cardId: string, note: NoteInput): Promise<Card>;
}

interface BlockerInput {
  question: string;                // What the agent needs — min: 1, max: 500
  author: string;                  // Agent identifier — max: 50
}
```

**Add Blocker Sequence:**
```
1. Read current card from .kanban/cards/{id}.md
2. Generate blocker ID: blk-{4 random alphanumeric chars}
3. Append blocker to card frontmatter blockers array:
   blockers:
     - id: blk-a1b2
       question: "Which auth provider should we use?"
       author: specops-analyst
       created: "2026-02-20T15:00:00Z"
4. Append blocker note to card body:
   ### 2026-02-20T15:00:00Z — specops-analyst [blocker]

   BLOCKED: Which auth provider should we use?
5. Update card.updated timestamp
6. Write card file (atomic)
7. Git commit (see section 4.6)
8. Trigger notifications:
   a. Slack: post to configured channel with card title + blocker question
   b. Vivian: announce if active meeting session
```

**Remove Blocker Sequence:**
```
1. Read current card from .kanban/cards/{id}.md
2. Remove blocker with matching ID from frontmatter blockers array
3. Append unblock note to card body:
   ### 2026-02-20T16:00:00Z — human [unblock]

   Resolved blocker blk-a1b2: Use Auth0 for the auth provider.
4. Update card.updated timestamp
5. Write card file (atomic)
6. Git commit (see section 4.6)
```

### 4.5 Concurrency Considerations

**Traces to:** OQ-003, NFR-002

Multiple writers may access `.kanban/` concurrently: AgentDispatch, VS Code extension, Claude Code skill, Vivian. The following rules govern concurrent access.

**Strategy: Optimistic Concurrency with Atomic Writes**

```
File Locking:
  - No OS-level file locks (not portable, git-unfriendly)
  - Writers use atomic write-then-rename for individual files
  - Writers read-then-write board.yaml as a critical section

Atomic Write Protocol (all writers MUST follow):
  1. Write content to {file}.tmp in the same directory
  2. Call fsync on the file descriptor
  3. Rename {file}.tmp -> {file} (atomic on POSIX)
  4. The .tmp file MUST be in the same directory as the target
     (to guarantee same-filesystem rename atomicity)

board.yaml Coordination:
  - board.yaml is the only file with concurrent write risk
    (multiple agents may move cards simultaneously)
  - Strategy: read-modify-write with retry
    1. Read board.yaml
    2. Modify cardOrder in memory
    3. Write board.yaml.tmp
    4. Rename to board.yaml
    5. If the rename succeeds, done
    6. If another writer modified board.yaml between read and write,
       the rename still succeeds (last writer wins for cardOrder)
  - cardOrder is append-only per column (moves are remove+append),
    so concurrent moves to different columns are safe
  - Concurrent moves of the SAME card are resolved by last-writer-wins
    (acceptable at <50 card scale per NFR-006)

Card File Coordination:
  - Each card is a separate file, so concurrent writes to DIFFERENT cards
    are fully isolated
  - Concurrent writes to the SAME card (rare) use last-writer-wins
  - Card.updated timestamp helps detect stale writes at the application layer

Git Coordination:
  - Only AgentDispatch commits kanban file changes
  - Human changes via VS Code or Claude Code are committed by the human
    or left uncommitted (working tree changes)
  - AgentDispatch runs `git add .kanban/ && git commit` after each operation
```

### 4.6 Git Commit Conventions

**Traces to:** KB-009, NFR-003

All agent-initiated kanban changes are committed to git with a standardized message format.

```
Commit Message Format:
  kanban({action}): {card-id} {title-truncated-to-50-chars}

  {Optional body with details}

Actions (for commit prefix):
  create   — new card file created
  move     — card moved between columns
  block    — blocker added to card
  unblock  — blocker removed from card
  note     — note appended to card
  archive  — card moved to archive
  init     — board initialized

Examples:
  kanban(create): a1b2c3 Implement user authentication
  kanban(move): a1b2c3 Implement user authentication
    Spec Creation -> Building
  kanban(block): a1b2c3 Implement user authentication
    BLOCKED: Which auth provider should we use?
  kanban(unblock): a1b2c3 Implement user authentication
    Resolved: Use Auth0 for the auth provider.

Git Operations:
  1. git add .kanban/cards/{id}.md .kanban/board.yaml
  2. git commit -m "{message}"
  3. Do NOT auto-push (local commits only; push is manual or on schedule)

Staged Files:
  - Only stage files under .kanban/ that were modified by the operation
  - Never stage unrelated working tree changes
  - Use explicit file paths in git add (not git add -A)
```

---

## 5. CMS Dashboard <- AgentDispatch (Consumed API)

The CMS ops dashboard consumes real-time events from AgentDispatch via WebSocket and SSE. The CMS is read-only (KB-019) and does not write to AgentDispatch or `.kanban/` files.

**Use Cases:** UC-006
**Confirmed by:** A-008 (CMS is read-only), A-009 (existing AgentDispatch WebSocket/SSE endpoints are sufficient)

### 5.0 CMS HTTP Entry Point — `GET /ops`

**Description:** HTTP endpoint serving the CMS ops dashboard page. This is the entry point for the browser-based dashboard.
**Traces to:** UC-006 step 1, KB-020
**Auth:** Basic HTTP auth — 401 returned if credentials are missing or invalid

```
Endpoint:
  URL: http://{agentdispatch-host}:{port}/ops
  Method: GET
  Auth: Basic auth (Authorization header)
  Content-Type: text/html (serves dashboard page)

Response Codes:
  200 — Dashboard page served (authenticated)
  401 — Unauthorized (missing or invalid credentials)

Behavior:
  1. Check Authorization header for valid Basic auth credentials
  2. If missing or invalid: return 401 with WWW-Authenticate: Basic header
  3. If valid: serve the CMS ops dashboard HTML page
  4. Dashboard page initializes WebSocket and SSE connections (see 5.1, 5.4)
```

**Credential Management:**
- Credentials stored in environment variable `KANBAN_CMS_PASSWORD` (see Security section below)
- Username is configurable via `KANBAN_CMS_USERNAME` (default: `ops`)
- Password is compared using constant-time comparison to prevent timing attacks
- No session tokens — Basic auth is sent with every request (including WebSocket upgrade)

---

### 5.1 WebSocket Connection — `/dashboard/ws`

**Description:** Persistent WebSocket connection for real-time dashboard events.
**Traces to:** UC-006 step 3, KB-016, NFR-005
**Auth:** Basic HTTP auth (KB-020) — credentials sent in initial HTTP upgrade request

```
Connection:
  URL: ws://{agentdispatch-host}:{port}/dashboard/ws
  Protocol: WebSocket (RFC 6455)
  Auth: Basic auth header in upgrade request
  Reconnect: Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 10s)
  Heartbeat: Server sends ping every 30s; client responds with pong
  Timeout: Connection closed if no pong received within 10s of ping
```

**Event Frame Format:**

All WebSocket messages are JSON text frames with this envelope:

```typescript
interface DashboardEvent {
  type: DashboardEventType;        // Event discriminator
  timestamp: string;               // ISO 8601 — when the event occurred
  payload: Record<string, unknown>;// Event-specific data (see below)
}

type DashboardEventType =
  | "task.state_change"
  | "agent.tool_call"
  | "agent.thinking"
  | "agent.session_start"
  | "agent.session_complete"
  | "agent.blocked";
```

### 5.2 Event Type: `task.state_change`

**Description:** Fired when a kanban card changes column or state.
**Traces to:** UC-006 step 5 (pipeline overview updates), KB-018

```typescript
interface TaskStateChangeEvent {
  type: "task.state_change";
  timestamp: string;               // ISO 8601
  payload: {
    cardId: string;                // 6-char kanban card ID
    title: string;                 // Card title
    previousColumn: string;        // Column name before change
    newColumn: string;             // Column name after change
    agentId?: string;              // Agent that triggered the change (if agent-driven)
    agentName?: string;            // Human-readable agent name
    repo: string;                  // Repository name (for cross-repo context)
  };
}
```

**CMS Behavior on Receipt:**
```
1. Update pipeline overview column counts:
   - Decrement previousColumn count
   - Increment newColumn count
2. If newColumn is a "done" column:
   - Add to recent completions feed (prepend, cap at 20 items)
3. Animate the card transition in the pipeline bar
```

### 5.3 Event Type: `agent.tool_call`

**Description:** Fired when an agent invokes a tool (file write, shell command, API call, etc.).
**Traces to:** UC-006 step 6, KB-017

```typescript
interface AgentToolCallEvent {
  type: "agent.tool_call";
  timestamp: string;               // ISO 8601
  payload: {
    agentId: string;               // Agent session identifier
    agentName: string;             // Human-readable agent name (e.g., "specops-builder")
    toolName: string;              // Tool invoked (e.g., "file_write", "shell", "grep")
    toolInput: string;             // Truncated tool input summary — max: 200 chars
    cardId?: string;               // Associated kanban card ID (if known)
    repo: string;                  // Repository name
    sequenceNumber: number;        // Monotonic counter per agent session
  };
}
```

**CMS Behavior on Receipt:**
```
1. Find or create agent panel for agentId
2. Append tool call to the agent's scrolling activity feed:
   - Show timestamp (HH:MM:SS), tool icon, tool name, truncated input
   - Auto-scroll to bottom
3. Update agent panel "last active" indicator
4. Increment agent's tool call counter
```

### 5.4 Event Type: `agent.thinking`

**Description:** Streamed via SSE at `/agents/{id}/thinking`. Provides real-time visibility into agent reasoning.
**Traces to:** UC-006 step 4, KB-017

**Note:** This event type is delivered via SSE (Server-Sent Events), not the WebSocket connection. The CMS opens a separate SSE connection per active agent.

```
SSE Endpoint:
  URL: http://{agentdispatch-host}:{port}/agents/{agentId}/thinking
  Method: GET
  Auth: Basic auth header
  Content-Type: text/event-stream
  Reconnect: Auto-reconnect with 3s retry (per SSE spec retry field)
```

```typescript
interface AgentThinkingEvent {
  type: "agent.thinking";
  timestamp: string;               // ISO 8601
  payload: {
    agentId: string;               // Agent session identifier
    agentName: string;             // Human-readable agent name
    content: string;               // Thinking text chunk (streaming) — max: 500 chars
    isComplete: boolean;           // True if this is the final chunk of a thought
    cardId?: string;               // Associated kanban card ID (if known)
  };
}
```

**SSE Wire Format:**
```
event: agent.thinking
data: {"type":"agent.thinking","timestamp":"2026-02-20T15:30:00Z","payload":{"agentId":"sess_abc123","agentName":"specops-builder","content":"Analyzing the auth module structure...","isComplete":false,"cardId":"a1b2c3"}}

event: agent.thinking
data: {"type":"agent.thinking","timestamp":"2026-02-20T15:30:01Z","payload":{"agentId":"sess_abc123","agentName":"specops-builder","content":"I'll create jwt.ts with refresh token rotation.","isComplete":true,"cardId":"a1b2c3"}}
```

**CMS Behavior on Receipt:**
```
1. Find agent panel for agentId
2. If isComplete is false: append content to current thinking bubble (streaming text)
3. If isComplete is true: finalize thinking bubble, start new one on next event
4. Thinking text displayed in a collapsible section below tool calls
5. Auto-scroll within the thinking section
```

### 5.5 Event Type: `agent.session_start`

**Description:** Fired when AgentDispatch starts a new agent session.
**Traces to:** UC-006 step 6

```typescript
interface AgentSessionStartEvent {
  type: "agent.session_start";
  timestamp: string;               // ISO 8601
  payload: {
    agentId: string;               // New agent session identifier
    agentName: string;             // Human-readable agent name
    agentType: string;             // Agent role (e.g., "specops-analyst", "specops-builder")
    cardId?: string;               // Kanban card being worked on (if applicable)
    cardTitle?: string;            // Card title for display
    repo: string;                  // Repository name
  };
}
```

**CMS Behavior on Receipt:**
```
1. Create a new agent panel in the active agents section
2. Show agent name, type, and associated card (if any)
3. Open SSE connection to /agents/{agentId}/thinking
4. Panel shows "Starting..." indicator with spinning animation
```

### 5.6 Event Type: `agent.session_complete`

**Description:** Fired when an agent session finishes (success or failure).
**Traces to:** UC-006 step 8

```typescript
interface AgentSessionCompleteEvent {
  type: "agent.session_complete";
  timestamp: string;               // ISO 8601
  payload: {
    agentId: string;               // Agent session identifier
    agentName: string;             // Human-readable agent name
    agentType: string;             // Agent role
    status: "success" | "failure" | "timeout";
                                   // How the session ended
    cardId?: string;               // Associated kanban card ID
    cardTitle?: string;            // Card title for display
    repo: string;                  // Repository name
    durationMs: number;            // Session duration in milliseconds
    toolCallCount: number;         // Total tool calls made in the session
    summary?: string;              // Agent-provided completion summary — max: 500 chars
  };
}
```

**CMS Behavior on Receipt:**
```
1. Find agent panel for agentId
2. Close SSE connection to /agents/{agentId}/thinking
3. Mark panel as "Completed" (success) or "Failed" (failure) or "Timed Out" (timeout)
4. Show duration and tool call count
5. After 60 seconds, collapse panel to summary line in recent activity
6. If status is "success" and cardId is provided, the card may have moved
   (wait for corresponding task.state_change event)
```

### 5.7 Event Type: `agent.blocked`

**Description:** Fired when an agent encounters a blocker and needs human input.
**Traces to:** UC-006 step 7, KB-012

```typescript
interface AgentBlockedEvent {
  type: "agent.blocked";
  timestamp: string;               // ISO 8601
  payload: {
    agentId: string;               // Agent session identifier
    agentName: string;             // Human-readable agent name
    cardId: string;                // Kanban card ID (required — blockers are card-level)
    cardTitle: string;             // Card title for display
    blockerId: string;             // Blocker ID — pattern: ^blk-[a-z0-9]{4}$
    question: string;              // What the agent needs — max: 500 chars
    repo: string;                  // Repository name
  };
}
```

**CMS Behavior on Receipt:**
```
1. Add to "Blocked Items" section (prominent, top of dashboard)
2. Display card title, agent name, and blocker question
3. Show pulsing/attention-grabbing indicator
4. Item remains in blocked section until a task.state_change removes it
   or until a new event indicates the blocker was resolved
```

### 5.8 Connection Lifecycle

```
CMS Dashboard Initialization:
  1. Authenticate with basic auth credentials
  2. Open WebSocket to /dashboard/ws
  3. On WebSocket open:
     a. Server sends initial state snapshot (all active agents, pipeline counts)
     b. CMS renders initial dashboard state
  4. For each active agent in snapshot:
     a. Open SSE connection to /agents/{agentId}/thinking
  5. Process events as they arrive

Reconnection (NFR-005):
  1. On WebSocket close or error:
     a. Display "Reconnecting..." banner
     b. Retry with exponential backoff: 1s, 2s, 4s, 8s, max 10s
     c. On reconnect, server resends current state snapshot
     d. CMS reconciles snapshot with local state
  2. On SSE close or error:
     a. Retry per SSE spec (server sends retry: 3000)
     b. SSE events have IDs; server resumes from last-event-id

Initial State Snapshot (sent on WebSocket connect):
```

```typescript
interface DashboardSnapshot {
  type: "snapshot";
  timestamp: string;               // ISO 8601
  payload: {
    pipeline: Record<string, number>;
      // Column name -> card count (for pipeline overview bar)
    activeAgents: ActiveAgentSummary[];
    blockedCards: BlockedCardSummary[];
    recentCompletions: CompletionSummary[];
  };
}

interface ActiveAgentSummary {
  agentId: string;
  agentName: string;
  agentType: string;
  cardId?: string;
  cardTitle?: string;
  repo: string;
  startedAt: string;               // ISO 8601
  toolCallCount: number;
}

interface BlockedCardSummary {
  cardId: string;
  cardTitle: string;
  blockerId: string;
  question: string;
  agentName: string;
  repo: string;
  blockedAt: string;               // ISO 8601
}

interface CompletionSummary {
  cardId: string;
  cardTitle: string;
  agentName: string;
  repo: string;
  completedAt: string;             // ISO 8601
  status: "success" | "failure" | "timeout";
}
```

---

## 6. Vivian -> .kanban/ (File I/O Protocol)

Vivian creates kanban cards from meeting action items by writing directly to `.kanban/` files. Vivian follows the same file format and atomic write protocol as all other writers.

**Use Cases:** UC-009
**Traces to:** KB-026, KB-027

### 6.1 Card Creation from Meeting Action Items

```typescript
interface VivianCardWriter {
  /**
   * Create a kanban card from a meeting action item.
   * Traces to: UC-009 steps 2-4
   *
   * @param repoPath - Absolute path to target repo root
   * @param actionItem - Extracted action item from meeting
   * @returns Created card
   */
  createCardFromActionItem(
    repoPath: string,
    actionItem: VivianActionItem
  ): Promise<Card>;
}

interface VivianActionItem {
  title: string;                   // Action item title from voice extraction — min: 1, max: 200
  description?: string;            // Additional context from meeting — max: 2000
  priority?: CardPriority;         // Inferred priority — default: "medium"
  assignee?: string;               // Person assigned in meeting — max: 50
  meetingTitle: string;            // Meeting name/title — min: 1, max: 200
  meetingDate: string;             // ISO 8601 date of the meeting
  labels?: string[];               // Inferred labels — default: []
  due?: string;                    // Deadline mentioned in meeting — ISO 8601 date
}
```

**Card Creation Sequence:**
```
1. Resolve target repo:
   a. If repoPath provided, use directly
   b. If ambiguous, Vivian asks human "Which project?" (AF-009.1)
2. Verify .kanban/ exists at {repoPath}/.kanban/
   a. If not, initialize default board (same as AF-003.3)
3. Generate 6-char alphanumeric card ID
4. Build card frontmatter:
   - source: "vivian"
   - meeting: "{meetingTitle}"
   - column: "Backlog" (always — action items start in Backlog)
   - All other fields from VivianActionItem
5. Build card body:
   {description}

   ## Notes

   ### {timestamp} — vivian [comment]

   Created from meeting: {meetingTitle} ({meetingDate})
6. Write card file (atomic write-then-rename)
7. Update board.yaml cardOrder: append card ID to Backlog
8. Write board.yaml (atomic write-then-rename)
9. Vivian confirms: "Created card {title} in backlog."
```

### 6.2 Card Metadata Conventions

Cards created by Vivian have these distinctive metadata fields:

```yaml
# Vivian-specific frontmatter fields
source: vivian                     # Always "vivian" for meeting-created cards
meeting: "Weekly SDLC Standup"     # Meeting title — required for vivian cards

# Card body always includes a creation note:
## Notes

### 2026-02-20T10:00:00Z — vivian [comment]

Created from meeting: Weekly SDLC Standup (2026-02-20)
Action item discussed during architecture review segment.
```

### 6.3 Vivian Blocker Announcements

When Vivian detects a blocker on an existing card (via AgentDispatch notification), Vivian can announce it in the current meeting. This is read-only from Vivian's perspective — Vivian does NOT modify the card file when announcing a blocker.

```
Vivian reads .kanban/cards/{id}.md to get:
  - card.title
  - card.blockers[].question
  - card.assignee

Vivian announces: "{assignee} is blocked on '{title}': {question}"
```

---

## 7. Adapter Interfaces

Adapters enrich kanban cards with data from external sources at display time. They are read-only — adapters never write to `.kanban/` files. Each adapter reads its respective data source and returns enrichment data keyed by card references.

**Use Cases:** UC-001 step 4
**Traces to:** KB-002, BR-004

### 7.1 Base Adapter Interface

All adapters implement this interface:

```typescript
interface KanbanAdapter<TEnrichment> {
  /**
   * Adapter identifier.
   */
  readonly name: AdapterType;

  /**
   * Check if this adapter's data source exists and is readable.
   *
   * @param repoRoot - Absolute path to repo root
   * @returns true if the data source exists
   */
  isAvailable(repoRoot: string): Promise<boolean>;

  /**
   * Read the data source and return enrichment data for cards that have
   * matching references.
   *
   * @param repoRoot - Absolute path to repo root
   * @param cards - Cards to potentially enrich (adapter checks card references)
   * @returns Map of cardId -> enrichment data (only cards with matches)
   */
  enrich(repoRoot: string, cards: Card[]): Promise<Map<string, TEnrichment>>;
}
```

### 7.2 RalphAdapter

**Description:** Reads `.ralph/features.json` and maps feature data to card enrichment. Ralph tracks feature build progress, files modified, and phase state.

**Data Source:** `{repoRoot}/.ralph/features.json`
**Card Reference Field:** `card.ralphFeature` (matches a key in `features.json`)

```typescript
interface RalphAdapter extends KanbanAdapter<RalphEnrichment> {
  readonly name: "ralph";

  /**
   * Check if .ralph/features.json exists.
   */
  isAvailable(repoRoot: string): Promise<boolean>;

  /**
   * Read .ralph/features.json, match against cards with ralphFeature references,
   * and return build progress enrichment.
   *
   * Matching logic:
   *   For each card where card.ralphFeature is defined:
   *     Look up features[card.ralphFeature] in features.json
   *     If found, extract enrichment fields
   */
  enrich(repoRoot: string, cards: Card[]): Promise<Map<string, RalphEnrichment>>;
}

/**
 * Expected shape of .ralph/features.json entries.
 * This is the external data format Ralph produces — we read it, never write it.
 */
interface RalphFeaturesFile {
  [featureKey: string]: RalphFeatureEntry;
}

interface RalphFeatureEntry {
  name: string;                    // Feature display name
  phase: string;                   // Current ralph phase (e.g., "building", "testing")
  progress: number;                // Build progress 0-100
  filesModified: string[];         // List of modified file paths
  lastActivity: string;            // ISO 8601 timestamp
}

/**
 * Enrichment data returned to the card display layer.
 */
interface RalphEnrichment {
  buildProgress?: number;          // 0-100 percentage from RalphFeatureEntry.progress
  phase?: string;                  // From RalphFeatureEntry.phase
  filesModified?: number;          // Count of RalphFeatureEntry.filesModified
}
```

**Mapping Logic:**
```
Input:  card.ralphFeature = "user-auth"
Lookup: .ralph/features.json["user-auth"]
Output: {
  buildProgress: features["user-auth"].progress,
  phase: features["user-auth"].phase,
  filesModified: features["user-auth"].filesModified.length
}
```

### 7.3 SpecopsAdapter

**Description:** Reads `.specops/state.json` and maps spec pipeline state to card enrichment. SPECOPS tracks which spec phases have been completed for each feature.

**Data Source:** `{repoRoot}/.specops/state.json`
**Card Reference Field:** `card.specRef` (matches a key in `state.json`)

```typescript
interface SpecopsAdapter extends KanbanAdapter<SpecopsEnrichment> {
  readonly name: "specops";

  /**
   * Check if .specops/state.json exists.
   */
  isAvailable(repoRoot: string): Promise<boolean>;

  /**
   * Read .specops/state.json, match against cards with specRef references,
   * and return spec phase enrichment.
   *
   * Matching logic:
   *   For each card where card.specRef is defined:
   *     Look up state[card.specRef] in state.json
   *     If found, extract enrichment fields
   */
  enrich(repoRoot: string, cards: Card[]): Promise<Map<string, SpecopsEnrichment>>;
}

/**
 * Expected shape of .specops/state.json entries.
 * This is the external data format SPECOPS produces — we read it, never write it.
 */
interface SpecopsStateFile {
  [featureKey: string]: SpecopsFeatureState;
}

interface SpecopsFeatureState {
  phase: string;                   // Current specops phase
  completedPhases: string[];       // Phases that have been completed
  lastActivity: string;            // ISO 8601 timestamp
  status: string;                  // Overall status (e.g., "active", "blocked", "complete")
}

/**
 * Enrichment data returned to the card display layer.
 */
interface SpecopsEnrichment {
  specPhase?: string;              // From SpecopsFeatureState.phase
  completedPhases?: string[];      // From SpecopsFeatureState.completedPhases
  lastActivity?: string;           // From SpecopsFeatureState.lastActivity
}
```

**Mapping Logic:**
```
Input:  card.specRef = "user-auth"
Lookup: .specops/state.json["user-auth"]
Output: {
  specPhase: state["user-auth"].phase,
  completedPhases: state["user-auth"].completedPhases,
  lastActivity: state["user-auth"].lastActivity
}
```

### 7.4 SpecArtifactAdapter

**Description:** Reads spec artifact files (`specs/*/open-questions.md` and `specs/*/decisions.md`) and provides counts of open questions and decisions. This gives visibility into spec maturity.

**Data Source:** `{repoRoot}/specs/{specRef}/open-questions.md` and `{repoRoot}/specs/{specRef}/decisions.md`
**Card Reference Field:** `card.specRef` (matches a directory name under `specs/`)

```typescript
interface SpecArtifactAdapter extends KanbanAdapter<SpecArtifactEnrichment> {
  readonly name: "specArtifact";

  /**
   * Check if specs/ directory exists.
   */
  isAvailable(repoRoot: string): Promise<boolean>;

  /**
   * For each card with a specRef, check if the corresponding specs/ subdirectory
   * exists and count open questions and decisions.
   *
   * Matching logic:
   *   For each card where card.specRef is defined:
   *     Check if specs/{card.specRef}/ directory exists
   *     If exists:
   *       Count ## headings in open-questions.md (each heading = one question)
   *       Count ## headings in decisions.md (each heading = one decision)
   *       Check existence of requirements.md
   *       Check existence of schemas.md
   */
  enrich(repoRoot: string, cards: Card[]): Promise<Map<string, SpecArtifactEnrichment>>;
}

/**
 * Enrichment data returned to the card display layer.
 */
interface SpecArtifactEnrichment {
  openQuestionCount?: number;      // Count of ## headings in open-questions.md
  decisionCount?: number;          // Count of ## headings in decisions.md
  hasRequirements?: boolean;       // Whether specs/{specRef}/requirements.md exists
  hasSchema?: boolean;             // Whether specs/{specRef}/schemas.md exists
}
```

**Parsing Logic:**
```
Input:  card.specRef = "user-auth"
Check:  specs/user-auth/ exists?

If exists:
  1. Read specs/user-auth/open-questions.md
     Count lines matching /^## / regex -> openQuestionCount
  2. Read specs/user-auth/decisions.md
     Count lines matching /^## / regex -> decisionCount
  3. Check specs/user-auth/requirements.md exists -> hasRequirements
  4. Check specs/user-auth/schemas.md exists -> hasSchema

Output: {
  openQuestionCount: 3,
  decisionCount: 5,
  hasRequirements: true,
  hasSchema: true
}
```

### 7.5 Adapter Error Handling

Adapters are best-effort. If an adapter's data source is unavailable or malformed, the card renders without that enrichment (AF-001.2).

```typescript
/**
 * Adapter errors do NOT propagate to the user as failures.
 * They are logged and the card renders without enrichment.
 */
interface AdapterError {
  adapter: AdapterType;            // Which adapter failed
  message: string;                 // Human-readable error
  path: string;                    // File path that failed to read/parse
}

/**
 * The adapter registry catches all adapter errors and collects them.
 * The UI may show a subtle indicator ("1 adapter unavailable") but
 * never blocks board rendering.
 */
interface AdapterResult {
  enrichments: Map<string, CardEnrichment>;
  errors: AdapterError[];
}
```

---

## 8. Security Contracts

### 8.1 CMS Credential Management (SEC-B-001)

**Traces to:** KB-020, NFR-004

CMS basic auth credentials are never hardcoded. The following environment variables govern authentication:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KANBAN_CMS_USERNAME` | No | `ops` | Basic auth username |
| `KANBAN_CMS_PASSWORD` | **Yes** | — | Basic auth password (plaintext in env, bcrypt-hashed at startup) |

**Server-side behavior:**

```
Startup:
  1. Read KANBAN_CMS_PASSWORD from environment
  2. If missing: FAIL CLOSED — refuse to start CMS, log error:
     "KANBAN_CMS_PASSWORD not set. CMS will not start without credentials."
  3. Hash password with bcrypt (cost factor 12) and store hash in memory
  4. Discard plaintext password from memory after hashing

Request authentication:
  1. Extract Basic auth credentials from Authorization header
  2. Compare username with constant-time string comparison
  3. Compare password against stored bcrypt hash using bcrypt.compare()
     (constant-time by design)
  4. If invalid: return 401 with WWW-Authenticate: Basic header
  5. If valid: proceed with request
```

**Credential rotation:**
- Change `KANBAN_CMS_PASSWORD` env var and restart CMS process
- No database or file storage of credentials — env var is the single source

### 8.2 Transport Security (SEC-B-002)

**Traces to:** KB-016, KB-020

All CMS-to-AgentDispatch communication uses plaintext HTTP/WS on the local LAN.

**Accepted Risk — LAN-Only Transport:**

This is a documented and accepted security trade-off for the AIFactory home lab environment:

| Factor | Assessment |
|--------|------------|
| Network scope | Private LAN (192.168.68.0/24) only |
| Exposure | NUC ↔ browser on same physical network |
| Basic auth over plaintext | Credentials Base64-encoded (not encrypted) on LAN |
| Threat model | LAN sniffing would require physical access or compromised device on same network |
| Mitigation | CORS restricted to LAN IP range; no internet exposure |

**If elevated security is needed in future:**
- Add self-signed TLS certificate to AgentDispatch
- Change all URLs from `ws://` → `wss://` and `http://` → `https://`
- Add certificate to CMS trust store
- No spec changes required beyond URL scheme updates

### 8.3 Path Traversal Prevention (SEC-B-003)

**Traces to:** BR-004

Fields that construct filesystem paths (`specRef`, `ralphFeature`, `ProjectConfig.path`) MUST be validated to prevent directory traversal attacks.

**Validation rules:**

```typescript
// specRef validation
function validateSpecRef(specRef: string, repoRoot: string): boolean {
  // Character allowlist: alphanumeric, hyphens, forward slashes (no ..)
  if (!/^[a-z0-9][a-z0-9\-\/]*$/.test(specRef)) return false;
  // No path traversal sequences
  if (specRef.includes('..')) return false;
  // Resolved path must be within repoRoot
  const resolved = path.resolve(repoRoot, specRef);
  return resolved.startsWith(path.resolve(repoRoot));
}

// ralphFeature validation
function validateRalphFeature(feature: string): boolean {
  // Character allowlist: alphanumeric, hyphens, underscores
  return /^[a-z0-9][a-z0-9\-_]*$/.test(feature) && feature.length <= 100;
}

// ProjectConfig.path validation
function validateProjectPath(projectPath: string): boolean {
  // Must be absolute path
  if (!path.isAbsolute(projectPath)) return false;
  // No path traversal sequences
  if (projectPath.includes('..')) return false;
  return true;
}
```

**Enforcement points:**
- `BoardReader.readBoard()` — validate `specRef` and `ralphFeature` on card parse
- `ProjectsConfig` parser — validate `path` on projects.yaml parse
- Adapter `enrich()` methods — validate references before constructing file paths
- Reject cards/projects with invalid paths; log warning; skip enrichment for that card

### 8.4 Slack Webhook Signature Verification (SEC-B-004)

**Traces to:** KB-012, AF-002.1

Slack replies that resolve blockers MUST be authenticated via Slack's signing secret mechanism to prevent spoofed unblock requests.

**Verification protocol:**

```
On incoming Slack webhook POST:
  1. Read X-Slack-Request-Timestamp header
  2. Reject if timestamp is >5 minutes from server time (replay protection)
  3. Construct signature base string:
     sig_basestring = "v0:{timestamp}:{request_body}"
  4. Compute HMAC-SHA256 of sig_basestring using SLACK_SIGNING_SECRET
  5. Compare computed signature with X-Slack-Signature header (constant-time)
  6. If mismatch: return 401, log warning, do NOT process the unblock
  7. If valid: proceed with blocker resolution
```

**Environment variables:**

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_SIGNING_SECRET` | Yes (if Slack integration enabled) | Slack app signing secret for webhook verification |
| `SLACK_BOT_TOKEN` | Yes (if Slack integration enabled) | Slack bot token for sending notifications |

**Fail-closed behavior:**
- If `SLACK_SIGNING_SECRET` is not set: reject all incoming Slack webhooks
- If `SLACK_BOT_TOKEN` is not set: skip Slack notifications (log warning), do not block card operations

---

## Appendix A: Directory Structure

```
{repo-root}/
  .kanban/
    board.yaml                     # Board configuration and card ordering
    cards/                         # Active card files
      {id}.md                      # Individual card (frontmatter + markdown body)
    archive/                       # Archived card files (same format as cards/)
      {id}.md
  .ralph/
    features.json                  # Ralph feature tracking (read by RalphAdapter)
  .specops/
    state.json                     # SPECOPS pipeline state (read by SpecopsAdapter)
  specs/
    {feature-name}/
      requirements.md              # Feature requirements (read by SpecArtifactAdapter)
      open-questions.md            # Open questions (read by SpecArtifactAdapter)
      decisions.md                 # Recorded decisions (read by SpecArtifactAdapter)
      schemas.md                   # Data schemas (read by SpecArtifactAdapter)

{kanban-project-root}/
  projects.yaml                    # Cross-repo project configuration
```

## Appendix B: Card ID Generation

```typescript
/**
 * Generate a 6-character lowercase alphanumeric ID.
 * Pattern: ^[a-z0-9]{6}$
 * Collision space: 36^6 = 2,176,782,336 possible IDs
 * At <50 cards per board, collision probability is negligible.
 *
 * Algorithm:
 *   1. Generate 6 random characters from charset [a-z0-9]
 *   2. Check .kanban/cards/{id}.md does not exist
 *   3. Check .kanban/archive/{id}.md does not exist
 *   4. If collision, retry (max 5 attempts)
 *   5. If 5 collisions, throw CardIdGenerationError
 */
const CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 6;
```

## Appendix C: SDLC Column Progression

Per BR-001, the default SDLC column ordering defines the expected progression for agent-driven work:

```
Backlog -> Spec Creation -> Spec Review -> Building -> Testing -> Human Review -> Done
```

Agents move cards forward through this progression. Backward movement (e.g., Testing -> Building on verification failure) is allowed. Human can move cards to any column via drag-and-drop or CLI.

## Appendix D: Cross-Reference Matrix

| Contract Surface | Reads From | Writes To | Use Cases |
|-----------------|------------|-----------|-----------|
| VS Code Extension | board.yaml, cards/*.md, .ralph/, .specops/, specs/ | cards/*.md, board.yaml | UC-001, UC-002, UC-005, UC-007, UC-008 |
| Claude Code Skill | board.yaml, cards/*.md | cards/*.md, board.yaml, archive/*.md | UC-007 |
| AgentDispatch | board.yaml, cards/*.md | cards/*.md, board.yaml, git commits | UC-003, UC-004 |
| CMS Dashboard | WebSocket /dashboard/ws, SSE /agents/{id}/thinking | (read-only) | UC-006 |
| Vivian | board.yaml | cards/*.md, board.yaml | UC-009 |
| RalphAdapter | .ralph/features.json | (read-only) | UC-001 |
| SpecopsAdapter | .specops/state.json | (read-only) | UC-001 |
| SpecArtifactAdapter | specs/*/open-questions.md, specs/*/decisions.md | (read-only) | UC-001 |
