# Acceptance Criteria — Kanban Dashboard

Spec type: **fullstack**
Date: 2026-02-20

---

## Table of Contents

- [UC-001: Human Views SDLC Board](#uc-001-human-views-sdlc-board)
- [UC-002: Human Unblocks a Card](#uc-002-human-unblocks-a-card)
- [UC-003: Agent Creates a Card](#uc-003-agent-creates-a-card)
- [UC-004: Agent Moves a Card Through SDLC](#uc-004-agent-moves-a-card-through-sdlc)
- [UC-005: Human Views Cross-Repo Dashboard](#uc-005-human-views-cross-repo-dashboard)
- [UC-006: Human Views CMS Live Operations Dashboard](#uc-006-human-views-cms-live-operations-dashboard)
- [UC-007: Human Creates a Card Manually](#uc-007-human-creates-a-card-manually)
- [UC-008: Human Drags Card Between Columns](#uc-008-human-drags-card-between-columns)
- [UC-009: Vivian Creates Card from Meeting Action Item](#uc-009-vivian-creates-card-from-meeting-action-item)
- [Happy Path: Full SDLC Flow](#happy-path-full-sdlc-flow)
- [Edge Cases](#edge-cases)
- [Blocker Flow](#blocker-flow)
- [Auto-Archive](#auto-archive)
- [Cross-Repo Dashboard](#cross-repo-dashboard)
- [CMS Read-Only Verification](#cms-read-only-verification)
- [UX Completeness](#ux-completeness)

---

## UC-001: Human Views SDLC Board

### AC-001: Board renders SDLC columns from board.yaml (KB-001)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** a `.kanban/` directory exists in the workspace
**And** `.kanban/board.yaml` defines columns: Backlog, Spec Creation, Spec Review, Building, Testing, Human Review, Done

**When** the human opens the kanban board view in VS Code

**Then** the extension renders seven columns in the order defined in board.yaml
**And** each column header displays the column name
**And** each column header displays its configured WIP limit (if set)
**And** the column order matches: Backlog, Spec Creation, Spec Review, Building, Testing, Human Review, Done

#### Cross-References
- **Wireframe:** `board-view.json#column_headers` -> `board-view.json`
- **Business Rule:** BR-001 — SDLC Column Ordering
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)
- **Schema Entity:** Column — [schemas.md#column](schemas.md#column)

---

### AC-002: Cards display enriched data from adapter sources (KB-002)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** a card `abc123.md` exists in `.kanban/cards/` with frontmatter `ralphFeature: auth-login`
**And** `.ralph/features.json` contains a feature `auth-login` with `progress: 75`
**And** `specs/auth-login/open-questions.md` contains 3 unresolved questions

**When** the extension renders the board

**Then** card `abc123` displays a build progress indicator showing 75%
**And** card `abc123` displays a question count badge showing "3 open questions"

#### Cross-References
- **Wireframe:** `board-view.json#card_enrichment_area` -> `card-detail.json`
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-003: Board loads responsively with 50 cards (KB-003)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** `.kanban/cards/` contains 50 card files distributed across 7 SDLC columns
**And** `.ralph/features.json` and `.specops/state.json` contain matching adapter data

**When** the human opens the kanban board view

**Then** the board renders all 50 cards with adapter enrichment without perceptible lag
**And** card drag interactions respond without delay

#### Cross-References
- **Business Rule:** NFR-001 — Board Responsiveness
- **Business Rule:** NFR-006 — Scale

---

### AC-004: Board initializes when no .kanban/ directory exists (AF-001.1)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** the current workspace repo does not contain a `.kanban/` directory

**When** the human opens the kanban board view in VS Code

**Then** the extension displays an empty state with an "Initialize Board" button
**And** no error is thrown

#### Cross-References
- **Wireframe:** `board-view.json#empty_state` -> `board-view.json`

---

### AC-005: Initialize Board creates default SDLC structure (AF-001.1)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** the empty state is displayed with the "Initialize Board" button

**When** the human clicks the "Initialize Board" button

**Then** the extension creates `.kanban/board.yaml` with default SDLC columns (Backlog, Spec Creation, Spec Review, Building, Testing, Human Review, Done)
**And** the extension creates an empty `.kanban/cards/` directory
**And** the board view re-renders with the 7 default columns and no cards

#### Cross-References
- **Wireframe:** `board-view.json#initialize_button` -> `board-view.json`
- **Business Rule:** BR-001 — SDLC Column Ordering
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

### AC-006: Cards render without SDLC enrichment when adapters are absent (AF-001.2)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** a card `xyz789.md` exists in `.kanban/cards/` with title, column, priority, and labels
**And** the workspace has no `.ralph/` directory
**And** the workspace has no `.specops/` directory

**When** the extension renders the board

**Then** card `xyz789` displays title, priority, and labels from frontmatter
**And** card `xyz789` does not display build progress or question count
**And** no error is shown for missing adapter data

#### Cross-References
- **Wireframe:** `board-view.json#card_basic` -> `card-detail.json`
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-007: Malformed board.yaml displays validation error (EF-001.1)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** `.kanban/board.yaml` contains invalid YAML (e.g., missing `columns` key, broken syntax)

**When** the human opens the kanban board view

**Then** the extension displays an error message: "Board configuration is invalid: {validation error}"
**And** the extension offers an "Open board.yaml in editor" action button
**And** no board columns or cards are rendered

#### Cross-References
- **Wireframe:** `board-view.json#error_state` -> `board-view.json`

---

### AC-008: Malformed card file is skipped with warning (EF-001.2)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** `.kanban/cards/` contains 5 valid card files and 1 file `bad001.md` with unparseable YAML frontmatter

**When** the extension renders the board

**Then** the 5 valid cards are rendered in their respective columns
**And** `bad001.md` is not rendered on the board
**And** a warning indicator is displayed: "1 card skipped (parse error)"
**And** the extension logs the parse error with the filename

#### Cross-References
- **Wireframe:** `board-view.json#warning_indicator` -> `board-view.json`

---

## UC-002: Human Unblocks a Card

### AC-009: Blocked card displays visual indicator on board (KB-004)

**Use Case:** UC-002 — Human Unblocks a Card

**Given** a card `blk001.md` exists with a blocker `{id: "blk-x1y2", question: "What auth provider should we use?", author: "specops-builder", created: "2026-02-20T15:00:00Z"}` in frontmatter `blockers` list

**When** the extension renders the board

**Then** card `blk001` displays a distinct blocker icon (e.g., warning triangle)
**And** card `blk001` has a visually differentiated style (e.g., warning color border, pulsing animation)
**And** the blocker indicator is visible at the board level without opening the card

#### Cross-References
- **Wireframe:** `board-view.json#blocked_card_indicator` -> `card-detail.json`
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-010: Card detail view shows blocker question and response area (KB-005)

**Use Case:** UC-002 — Human Unblocks a Card

**Given** a card `blk001.md` has a blocker `{id: "blk-x1y2", question: "What auth provider should we use?", author: "specops-builder", created: "2026-02-20T15:00:00Z"}` in frontmatter `blockers` list

**When** the human clicks card `blk001` on the board

**Then** the card detail view opens
**And** the blocker section displays the agent's question: "What auth provider should we use?"
**And** a text area is available for the human to type a response
**And** an "Unblock" button is visible

#### Cross-References
- **Wireframe:** `card-detail.json#blocker_section` -> `card-detail.json`
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-011: Unblock action writes answer and removes blocker (KB-006)

**Use Case:** UC-002 — Human Unblocks a Card

**Given** card `blk001.md` has a blocker `{id: "blk-x1y2", question: "What auth provider should we use?", author: "specops-builder", created: "2026-02-20T15:00:00Z"}` in frontmatter `blockers` list
**And** the human has typed "Use Firebase Auth" in the response text area

**When** the human clicks the "Unblock" button

**Then** the blocker `blk-x1y2` is removed from the card's `blockers` list (list becomes empty)
**And** a note is appended to the card body with timestamp, author "human", and content "Use Firebase Auth"
**And** the card `updated` timestamp is refreshed to the current time
**And** the board re-renders with card `blk001` no longer showing the blocked indicator

#### Cross-References
- **Wireframe:** `card-detail.json#unblock_button` -> `board-view.json`
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Note — [schemas.md#note](schemas.md#note)

---

### AC-012: Unblock via Slack updates card file (AF-002.1)

**Use Case:** UC-002 — Human Unblocks a Card

**Given** card `blk001.md` has a blocker `{id: "blk-x1y2", question: "What auth provider should we use?", author: "specops-builder", created: "2026-02-20T15:00:00Z"}` in frontmatter
**And** a Slack blocker thread exists for this card

**When** the human replies to the Slack thread with "Use Firebase Auth"

**Then** AgentDispatch receives the Slack reply
**And** AgentDispatch appends a note to `blk001.md` with content "Use Firebase Auth" and author "human (slack)"
**And** AgentDispatch removes the blocker from `blk001.md` frontmatter
**And** the card `updated` timestamp is refreshed

#### Cross-References
- **API:** File I/O removeBlocker — [api-contracts.md#44-adding-blockers-and-notes](api-contracts.md#44-adding-blockers-and-notes)
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Note — [schemas.md#note](schemas.md#note)

---

### AC-013: Unblock via Vivian voice command updates card file (AF-002.2)

**Use Case:** UC-002 — Human Unblocks a Card

**Given** card `blk001.md` has a blocker `{id: "blk-x1y2", question: "What auth provider should we use?", author: "specops-builder", created: "2026-02-20T15:00:00Z"}` in frontmatter `blockers` list
**And** Vivian is active in a meeting

**When** the human says "Vivian, unblock What auth provider — Use Firebase Auth"

**Then** Vivian writes a note to `blk001.md` with content "Use Firebase Auth" and author "human (vivian)"
**And** Vivian removes the blocker from `blk001.md` frontmatter
**And** the card `updated` timestamp is refreshed

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Note — [schemas.md#note](schemas.md#note)

---

## UC-003: Agent Creates a Card

### AC-014: AgentDispatch creates card via file I/O (KB-007)

**Use Case:** UC-003 — Agent Creates a Card

**Given** AgentDispatch heartbeat detects a new feature `user-settings` in `.specops/state.json`
**And** the target repo has a `.kanban/` directory with `board.yaml`

**When** AgentDispatch processes the heartbeat tick

**Then** a new file `.kanban/cards/{id}.md` is created with valid YAML frontmatter containing title, column: Backlog, priority, labels, and created timestamp
**And** the generated card ID is appended to the Backlog column in `board.yaml` cardOrder
**And** the card file and board.yaml are written atomically (no partial state)

#### Cross-References
- **API:** File I/O — `.kanban/cards/{id}.md`, `.kanban/board.yaml`
- **Business Rule:** NFR-002 — File I/O Safety (write-then-rename)
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

### AC-015: Card IDs are 6-character lowercase alphanumeric (KB-008)

**Use Case:** UC-003 — Agent Creates a Card

**Given** AgentDispatch is creating a new card

**When** the card ID is generated

**Then** the ID matches the pattern `^[a-z0-9]{6}$`
**And** the ID does not collide with any existing card ID in `.kanban/cards/`

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-016: Agent card creation triggers git commit (KB-009)

**Use Case:** UC-003 — Agent Creates a Card

**Given** AgentDispatch has created `.kanban/cards/abc123.md` and updated `board.yaml`

**When** the file writes complete

**Then** a git commit is created containing both the new card file and the updated board.yaml
**And** the commit message is descriptive (e.g., "kanban: create card abc123 — {card title}")

#### Cross-References
- **Business Rule:** NFR-003 — Git Friendliness

---

### AC-017: Card created from Vivian includes source metadata (AF-003.1)

**Use Case:** UC-003 — Agent Creates a Card

**Given** Vivian calls the AgentDispatch API with action item details from a meeting titled "Sprint Planning"

**When** AgentDispatch creates the card

**Then** the card frontmatter includes `source: vivian`
**And** the card frontmatter includes `meeting: Sprint Planning`

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-018: Card created from Slack includes source metadata (AF-003.2)

**Use Case:** UC-003 — Agent Creates a Card

**Given** a human uses the Slack `/dispatch task` command with task details

**When** AgentDispatch creates the card

**Then** the card frontmatter includes `source: slack`

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-019: Agent initializes .kanban/ when missing (AF-003.3)

**Use Case:** UC-003 — Agent Creates a Card

**Given** AgentDispatch needs to create a card in a target repo
**And** the target repo does not have a `.kanban/` directory

**When** AgentDispatch attempts card creation

**Then** AgentDispatch creates `.kanban/board.yaml` with default SDLC columns
**And** AgentDispatch creates `.kanban/cards/` directory
**And** the new card is created in the freshly initialized `.kanban/cards/`
**And** the card ID is listed in the new board.yaml under the Backlog column

#### Cross-References
- **Business Rule:** BR-001 — SDLC Column Ordering
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

## UC-004: Agent Moves a Card Through SDLC

### AC-020: Agent moves card between columns via file I/O (KB-010)

**Use Case:** UC-004 — Agent Moves a Card Through SDLC

**Given** card `abc123.md` exists with `column: Spec Creation` in frontmatter
**And** the agent has completed the spec creation phase

**When** the agent moves the card to the next phase

**Then** card `abc123.md` frontmatter `column` is updated to `Spec Review`
**And** `board.yaml` cardOrder moves `abc123` from the `Spec Creation` list to the `Spec Review` list
**And** the card `updated` timestamp is refreshed
**And** both file writes are atomic

#### Cross-References
- **API:** File I/O — `.kanban/cards/abc123.md`, `.kanban/board.yaml`
- **Business Rule:** NFR-002 — File I/O Safety
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

### AC-021: Agent appends milestone note on phase completion (KB-011)

**Use Case:** UC-004 — Agent Moves a Card Through SDLC

**Given** card `abc123.md` is in the Building column
**And** the agent has completed the build phase producing files `src/auth.ts` and `src/auth.test.ts`

**When** the agent completes the phase and moves the card to Testing

**Then** a milestone note is appended to the card body containing:
  - Phase name: "Building"
  - Files created/modified: `src/auth.ts`, `src/auth.test.ts`
  - Test results summary (if applicable)
  - Timestamp and author (agent identity)

#### Cross-References
- **Schema Entity:** Note — [schemas.md#note](schemas.md#note)

---

### AC-022: Agent blocks and notifies all channels (KB-012)

**Use Case:** UC-004 — Agent Moves a Card Through SDLC

**Given** card `abc123.md` is in the Spec Creation column
**And** the agent encounters a question it cannot resolve

**When** the agent blocks on the card

**Then** the card frontmatter `blockers` list is updated with the blocker question
**And** a blocker note is appended to the card body with the question details
**And** the card stays in its current column (Spec Creation)
**And** AgentDispatch sends a Slack notification with the blocker question
**And** if Vivian is in an active meeting, Vivian announces the blocker

#### Cross-References
- **Business Rule:** BR-004 — Card Ownership (card is source of truth)
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-023: Verification failure keeps card in Testing (AF-004.2)

**Use Case:** UC-004 — Agent Moves a Card Through SDLC

**Given** card `abc123.md` is in the Testing column
**And** the spec-verify agent runs acceptance criteria checks

**When** verification finds 2 of 5 acceptance criteria failing

**Then** the card remains in the Testing column
**And** a failure note is appended to the card body with details of the 2 failing criteria
**And** the card `updated` timestamp is refreshed
**And** no column transition occurs

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Note — [schemas.md#note](schemas.md#note)

---

### AC-024: Agent card movement triggers git commit (KB-009)

**Use Case:** UC-004 — Agent Moves a Card Through SDLC

**Given** an agent has moved card `abc123` from Building to Testing
**And** the card file and board.yaml are updated on disk

**When** the file writes complete

**Then** a git commit is created containing the updated card file and board.yaml
**And** the commit message is descriptive (e.g., "kanban: move abc123 Building -> Testing")

#### Cross-References
- **Business Rule:** NFR-003 — Git Friendliness

---

## UC-005: Human Views Cross-Repo Dashboard

### AC-025: Dashboard reads projects.yaml and aggregates repos (KB-013)

**Use Case:** UC-005 — Human Views Cross-Repo Dashboard

**Given** `projects.yaml` is configured with 3 repos: AgentDispatch, SPECOPS, Vivian
**And** each repo has a `.kanban/` directory with cards

**When** the human opens the cross-repo dashboard panel in VS Code

**Then** the dashboard displays 3 project cards, one per repo
**And** each project card shows the repo name

#### Cross-References
- **Wireframe:** `dashboard-view.json#project_cards` -> `dashboard-view.json`
- **Schema Entity:** ProjectConfig — [schemas.md#projectconfig](schemas.md#projectconfig)

---

### AC-026: Per-project summary shows completion metrics (KB-014)

**Use Case:** UC-005 — Human Views Cross-Repo Dashboard

**Given** repo AgentDispatch has 10 cards: 2 in Backlog, 3 in Building, 5 in Done
**And** `.ralph/features.json` has corresponding feature progress data

**When** the dashboard renders the AgentDispatch project card

**Then** the project card shows completion percentage as 50% (5 of 10 in Done)
**And** the project card shows current phase: "Building" (most active column)
**And** the project card shows last activity date from the most recently updated card
**And** a progress bar visually represents the completion percentage

#### Cross-References
- **Wireframe:** `dashboard-view.json#project_summary` -> `dashboard-view.json`
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

### AC-027: Missing repo displays offline status (KB-015)

**Use Case:** UC-005 — Human Views Cross-Repo Dashboard

**Given** `projects.yaml` lists repo "ChartFlow" at path `/home/sam/src/ChartFlow`
**And** the path `/home/sam/src/ChartFlow` does not exist on disk

**When** the dashboard loads

**Then** the ChartFlow project card displays "offline" status
**And** the ChartFlow project card displays the last known state (if cached)
**And** the remaining repos are loaded and displayed normally
**And** the dashboard does not crash or display an unhandled error

#### Cross-References
- **Wireframe:** `dashboard-view.json#offline_project` -> `dashboard-view.json`
- **Schema Entity:** ProjectConfig — [schemas.md#projectconfig](schemas.md#projectconfig)

---

## UC-006: Human Views CMS Live Operations Dashboard

### AC-028: CMS establishes WebSocket to AgentDispatch (KB-016)

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS dashboard is running on the NUC
**And** AgentDispatch is running at `http://192.168.68.69:3001`
**And** the human has authenticated with basic auth

**When** the CMS dashboard loads the ops page

**Then** the CMS establishes a WebSocket connection to AgentDispatch at `/dashboard/ws`
**And** the connection is maintained as long as the page is open

#### Cross-References
- **API:** `WS /dashboard/ws` — [api-contracts.md#ws-dashboard](api-contracts.md#ws-dashboard)

---

### AC-029: CMS streams agent tool calls in real time (KB-017)

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS WebSocket is connected to AgentDispatch
**And** an agent session `agent-42` is actively running

**When** `agent-42` executes a tool call (e.g., `read_file src/auth.ts`)

**Then** the CMS active agent panel for `agent-42` displays the tool call with:
  - Tool name: `read_file`
  - Arguments: `src/auth.ts`
  - Timestamp of the call
  - A spinning activity indicator while the call is in progress

#### Cross-References
- **Wireframe:** `cms-ops.json#agent_panel` -> `cms-ops.json`
- **API:** `SSE /agents/{id}/thinking` — [api-contracts.md#sse-agent-thinking](api-contracts.md#sse-agent-thinking)

---

### AC-030: CMS displays pipeline overview with column counts (KB-018)

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS WebSocket is connected
**And** the kanban board has 2 cards in Backlog, 1 in Spec Creation, 3 in Building, 1 in Testing, 0 in Human Review, 4 in Done

**When** the CMS pipeline overview renders

**Then** the pipeline bar shows counts for each SDLC column: Backlog(2), Spec Creation(1), Spec Review(0), Building(3), Testing(1), Human Review(0), Done(4)
**And** the counts update in real-time as WebSocket events arrive

#### Cross-References
- **Wireframe:** `cms-ops.json#pipeline_overview` -> `cms-ops.json`
- **Business Rule:** BR-001 — SDLC Column Ordering

---

### AC-031: CMS is strictly read-only (KB-019)

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS ops dashboard is fully loaded and connected

**When** the human inspects the dashboard UI

**Then** no buttons, forms, or interactive elements exist that could modify kanban state
**And** no buttons, forms, or interactive elements exist that could modify agent state
**And** no write-capable API calls are made from the CMS to AgentDispatch
**And** the dashboard functions purely as a monitoring surface

#### Cross-References
- **Business Rule:** A-008 — CMS is read-only

---

### AC-032: CMS requires basic auth (KB-020)

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS dashboard is running on the NUC

**When** an unauthenticated request is made to the ops dashboard URL

**Then** the server responds with HTTP 401 Unauthorized
**And** a basic auth prompt is presented

#### Cross-References
- **API:** `GET /ops` — [api-contracts.md#50-cms-http-entry-point](api-contracts.md#50-cms-http-entry-point--get-ops)
- **Business Rule:** NFR-004 — CMS Dashboard Auth

---

### AC-033: CMS valid credentials grant access (KB-020)

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS dashboard is running on the NUC

**When** a request is made with valid basic auth credentials

**Then** the server responds with HTTP 200
**And** the ops dashboard page is rendered

#### Cross-References
- **API:** `GET /ops` — [api-contracts.md#50-cms-http-entry-point](api-contracts.md#50-cms-http-entry-point--get-ops)
- **Business Rule:** NFR-004 — CMS Dashboard Auth

---

### AC-034: CMS shows "No active agents" when none running (AF-006.1)

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS WebSocket is connected to AgentDispatch
**And** no agent sessions are currently running

**When** the CMS dashboard renders the agent panels area

**Then** the CMS displays "No active agents" message
**And** the CMS displays the last activity timestamp (from most recent completed session)
**And** the recent completions feed is still populated with past completions

#### Cross-References
- **Wireframe:** `cms-ops.json#no_agents_state` -> `cms-ops.json`

---

### AC-035: CMS handles AgentDispatch offline with reconnect (AF-006.2)

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS dashboard is open in the browser

**When** the WebSocket connection to AgentDispatch fails (AgentDispatch is unreachable)

**Then** the CMS displays an "AgentDispatch offline" banner prominently
**And** the CMS retries the WebSocket connection every 10 seconds
**And** static kanban state from the last known state is still displayed
**And** the dashboard does not require a page reload when the connection is restored

#### Cross-References
- **Business Rule:** NFR-005 — CMS WebSocket Resilience
- **Wireframe:** `cms-ops.json#offline_banner` -> `cms-ops.json`

---

## UC-007: Human Creates a Card Manually

### AC-036: VS Code extension provides card creation UI (KB-021)

**Use Case:** UC-007 — Human Creates a Card Manually

**Given** the kanban board is open in VS Code with at least one column visible

**When** the human clicks the "Add Card" button on a column header

**Then** a card creation form is displayed with fields for title, description, priority, and labels

#### Cross-References
- **Wireframe:** `board-view.json#add_card_button` -> `card-create-form.json`

---

### AC-037: Card creation form captures required fields (KB-023)

**Use Case:** UC-007 — Human Creates a Card Manually

**Given** the card creation form is displayed
**And** the human enters: title "Fix login bug", description "Users cannot log in with SSO", priority "high", labels ["bug", "auth"]

**When** the human submits the form

**Then** a new file `.kanban/cards/{id}.md` is created with frontmatter containing:
  - `title: Fix login bug`
  - `column: {target column name}`
  - `priority: high`
  - `labels: [bug, auth]`
  - `source: manual`
  - `created: {current ISO timestamp}`
  - `updated: {current ISO timestamp}`
**And** the card body contains the description "Users cannot log in with SSO"
**And** the card ID is appended to the target column in `board.yaml` cardOrder
**And** the board re-renders with the new card visible

#### Cross-References
- **Wireframe:** `card-create-form.json#submit_button` -> `board-view.json`
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-038: Card ID generated for manual cards follows standard format (KB-008)

**Use Case:** UC-007 — Human Creates a Card Manually

**Given** the human is creating a card via the VS Code extension

**When** the extension generates the card ID

**Then** the ID matches the pattern `^[a-z0-9]{6}$`
**And** the ID does not collide with any existing card in `.kanban/cards/`

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-039: Claude Code skill creates card via file write (KB-022)

**Use Case:** UC-007 — Human Creates a Card Manually

**Given** the human says "add a card for Implement dark mode" to Claude Code

**When** the kanban skill processes the command

**Then** a new `.kanban/cards/{id}.md` file is written with frontmatter containing `title: Implement dark mode` and `source: manual`
**And** `board.yaml` cardOrder is updated with the new card ID under the Backlog column
**And** the VS Code file watcher detects the change and triggers board re-render

#### Cross-References
- **API:** File I/O — `.kanban/cards/{id}.md`, `.kanban/board.yaml`
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-040: Claude Code skill supports full card CRUD (KB-022)

**Use Case:** UC-007 — Human Creates a Card Manually

**Given** the kanban board has existing cards

**When** the human uses the Claude Code kanban skill to list, move, update, and archive cards

**Then** the skill can list all cards with their columns and statuses
**And** the skill can move a card between columns (updating card file and board.yaml)
**And** the skill can update card fields (title, priority, labels, description)
**And** the skill can archive a card (move file to `.kanban/archive/`)

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

## UC-008: Human Drags Card Between Columns

### AC-041: Drag-and-drop between columns updates files (KB-024)

**Use Case:** UC-008 — Human Drags Card Between Columns

**Given** card `abc123` is displayed in the Backlog column on the board
**And** the card frontmatter has `column: Backlog`

**When** the human drags card `abc123` from Backlog to Spec Creation

**Then** the card file `abc123.md` frontmatter `column` is updated to `Spec Creation`
**And** `board.yaml` cardOrder removes `abc123` from the Backlog list
**And** `board.yaml` cardOrder adds `abc123` to the Spec Creation list
**And** the card `updated` timestamp is refreshed
**And** the board re-renders with the card in the Spec Creation column

#### Cross-References
- **Wireframe:** `board-view.json#card_drag` -> `board-view.json`
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

### AC-042: Drag-and-drop reorder within column updates board.yaml (KB-025)

**Use Case:** UC-008 — Human Drags Card Between Columns

**Given** the Building column contains cards in order: `abc123`, `def456`, `ghi789`

**When** the human drags `ghi789` above `abc123` within the Building column

**Then** `board.yaml` cardOrder for Building is updated to: `ghi789`, `abc123`, `def456`
**And** the board re-renders with the new card order
**And** no card frontmatter is modified (column unchanged)

#### Cross-References
- **Wireframe:** `board-view.json#card_reorder` -> `board-view.json`
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

### AC-043: Drag-and-drop triggers AgentDispatch pickup

**Use Case:** UC-008 — Human Drags Card Between Columns

**Given** the human has dragged card `abc123` from Backlog to Spec Creation
**And** the card file and board.yaml have been updated on disk

**When** AgentDispatch runs its next heartbeat

**Then** AgentDispatch detects the column change for card `abc123`
**And** AgentDispatch can act on the card in its new column

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

## UC-009: Vivian Creates Card from Meeting Action Item

### AC-044: Vivian creates card from voice command (KB-026)

**Use Case:** UC-009 — Vivian Creates Card from Meeting Action Item

**Given** Vivian is active in a meeting titled "Q1 Planning"
**And** the target repo has a `.kanban/` directory

**When** the human says "Vivian, create a task for Add multi-language support"

**Then** Vivian creates `.kanban/cards/{id}.md` with frontmatter containing `title: Add multi-language support`
**And** the card frontmatter includes `column: Backlog`
**And** the card ID is appended to the Backlog column in `board.yaml` cardOrder
**And** Vivian confirms: "Created card Add multi-language support in backlog."

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

### AC-045: Cards from Vivian include meeting metadata (KB-027)

**Use Case:** UC-009 — Vivian Creates Card from Meeting Action Item

**Given** Vivian creates a card during a meeting titled "Q1 Planning"

**When** the card file is written to disk

**Then** the card frontmatter includes `source: vivian`
**And** the card frontmatter includes `meeting: Q1 Planning`

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-046: Vivian disambiguates target repo (AF-009.1)

**Use Case:** UC-009 — Vivian Creates Card from Meeting Action Item

**Given** `projects.yaml` lists 3 repos: AgentDispatch, SPECOPS, Vivian
**And** the meeting context does not clearly indicate which repo the task belongs to

**When** the human says "Vivian, create a task for Update API docs"

**Then** Vivian asks "Which project?" or lists the available repos
**And** the human confirms the target repo
**And** the card is created in the confirmed repo's `.kanban/cards/`

#### Cross-References
- **Schema Entity:** ProjectConfig — [schemas.md#projectconfig](schemas.md#projectconfig)

---

## Happy Path: Full SDLC Flow

### AC-047: Card flows from creation to Done through all SDLC phases

**Use Case:** UC-003, UC-004 — Full SDLC Pipeline

**Given** AgentDispatch creates card `abc123` with title "Implement user preferences" in Backlog

**When** the card progresses through the full SDLC pipeline

**Then** the following sequence of state transitions occurs:
  1. Card created in Backlog with `source: agentdispatch`
  2. Agent moves card to Spec Creation; milestone note appended with requirements summary
  3. Agent moves card to Spec Review; milestone note appended with spec artifacts list
  4. Agent moves card to Building; milestone note appended with implementation plan
  5. Agent moves card to Testing; milestone note appended with files created/modified and test file list
  6. Agent moves card to Human Review; milestone note appended with test results summary
  7. Human reviews and moves card to Done
**And** each transition updates the card frontmatter `column` field
**And** each transition updates `board.yaml` cardOrder
**And** each transition refreshes the `updated` timestamp
**And** each agent transition creates a git commit
**And** the card body contains milestone notes for each phase in chronological order

#### Cross-References
- **Business Rule:** BR-001 — SDLC Column Ordering
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Note — [schemas.md#note](schemas.md#note)

---

## Edge Cases

### AC-048: Empty board renders correctly with no cards

**Use Case:** UC-001 — Human Views SDLC Board

**Given** `.kanban/board.yaml` defines all 7 SDLC columns
**And** `.kanban/cards/` directory is empty (no card files)

**When** the human opens the kanban board view

**Then** all 7 columns render with their headers and WIP limits
**And** each column displays zero cards
**And** the "Add Card" button is visible on each column header
**And** no errors or warnings are displayed

#### Cross-References
- **Wireframe:** `board-view.json#empty_columns` -> `board-view.json`

---

### AC-049: Board performs at scale target of 50 cards

**Use Case:** UC-001 — Human Views SDLC Board

**Given** `.kanban/cards/` contains 50 card files with varying columns, priorities, labels, and blockers
**And** adapter data exists in `.ralph/features.json` for 30 of the cards
**And** `specs/*/open-questions.md` exists for 15 of the cards

**When** the human opens the kanban board view

**Then** all 50 cards render in their respective columns with enrichment data
**And** scrolling within columns is smooth
**And** drag-and-drop operations respond without perceptible lag
**And** board initial load completes without timeout

#### Cross-References
- **Business Rule:** NFR-001 — Board Responsiveness
- **Business Rule:** NFR-006 — Scale

---

### AC-050: Card with no adapter data renders core fields only

**Use Case:** UC-001 — Human Views SDLC Board

**Given** card `xyz789.md` has frontmatter with title, column, priority, labels
**And** the card has no `ralphFeature` or `specRef` references
**And** no `.ralph/` directory exists
**And** no `.specops/` directory exists

**When** the extension renders card `xyz789`

**Then** the card displays title, priority badge, and labels
**And** no build progress indicator is shown
**And** no open questions badge is shown
**And** no error or placeholder is shown for missing adapter data

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-051: Concurrent agent writes to board.yaml do not corrupt state

**Use Case:** UC-003, UC-004 — Agent Creates/Moves a Card

**Given** agent A is writing card `aaa111.md` and updating `board.yaml`
**And** agent B is simultaneously writing card `bbb222.md` and updating `board.yaml`

**When** both agents attempt to update `board.yaml` concurrently

**Then** no partial or corrupted `board.yaml` is persisted to disk
**And** both cards eventually appear in `board.yaml` cardOrder
**And** if a write conflict occurs, the losing agent retries or the system uses a conflict resolution strategy (e.g., file locking, last-write-wins with retry)

#### Cross-References
- **Business Rule:** NFR-002 — File I/O Safety
- **Open Question:** OQ-003 — Concurrent write handling

---

### AC-052: Malformed card file with bad YAML frontmatter is isolated

**Use Case:** UC-001 — Human Views SDLC Board

**Given** `.kanban/cards/bad001.md` contains frontmatter with invalid YAML:
```
---
title: Good title
column: [unclosed bracket
priority: high
---
```
**And** 4 other valid card files exist

**When** the extension loads the board

**Then** the 4 valid cards render correctly
**And** `bad001.md` is skipped and not rendered
**And** a warning indicator shows "1 card skipped (parse error)"
**And** the warning is clickable or includes the filename for debugging

#### Cross-References
- **Wireframe:** `board-view.json#warning_indicator` -> `board-view.json`

---

### AC-053: Missing repo in projects.yaml is handled gracefully

**Use Case:** UC-005 — Human Views Cross-Repo Dashboard

**Given** `projects.yaml` lists 4 repos
**And** 1 repo path does not exist on disk (e.g., repo was deleted or drive unmounted)

**When** the cross-repo dashboard loads

**Then** the 3 accessible repos display their project cards with full health summaries
**And** the missing repo displays as "offline" with a grayed-out card
**And** the dashboard does not crash, hang, or display an unhandled exception
**And** the error is logged with the missing repo path

#### Cross-References
- **Schema Entity:** ProjectConfig — [schemas.md#projectconfig](schemas.md#projectconfig)

---

### AC-054: CMS reconnects after AgentDispatch restart

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS dashboard is connected to AgentDispatch via WebSocket
**And** AgentDispatch is restarted (process killed and relaunched)

**When** the WebSocket connection drops

**Then** the CMS displays "AgentDispatch offline" banner within 5 seconds
**And** the CMS retries the WebSocket connection every 10 seconds
**And** when AgentDispatch comes back online, the CMS reconnects automatically
**And** the "AgentDispatch offline" banner is removed
**And** real-time event streaming resumes without requiring a page reload

#### Cross-References
- **Business Rule:** NFR-005 — CMS WebSocket Resilience

---

## Blocker Flow

### AC-055: Full blocker lifecycle: block, notify, unblock, resume

**Use Case:** UC-002, UC-004 — Blocker Flow End-to-End

**Given** card `abc123` is in the Building column assigned to an agent
**And** Vivian is active in a meeting
**And** Slack integration is connected

**When** the agent encounters a blocker: "Should the API use REST or GraphQL?"

**Then** the following sequence occurs:
  1. **Block**: Agent adds a blocker `{id: "blk-r3s4", question: "Should the API use REST or GraphQL?", author: "specops-analyst", created: "..."}` to card `abc123.md` frontmatter `blockers` list
  2. **Card Note**: Agent appends a blocker note to the card body with the question
  3. **Card Visual**: The board displays card `abc123` with the blocked indicator (icon + pulsing)
  4. **Slack**: AgentDispatch sends a Slack notification with the blocker question and card context
  5. **Vivian**: Vivian announces in the active meeting: "Card abc123 is blocked — Should the API use REST or GraphQL?"
  6. **Human Sees**: Human sees the blocked card on the board (or receives Slack/Vivian notification)
  7. **Human Answers**: Human opens card detail and types "Use REST" and clicks Unblock
  8. **Unblock**: Card `abc123.md` frontmatter `blockers` is cleared
  9. **Note**: Human's answer "Use REST" is appended as a note with timestamp
  10. **Resume**: On next heartbeat, AgentDispatch detects the unblocked card and the agent resumes work

#### Cross-References
- **Business Rule:** A-010 — Blocker notifications go to all channels
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Note — [schemas.md#note](schemas.md#note)

---

### AC-056: Multiple simultaneous blockers on different cards

**Use Case:** UC-002, UC-004 — Blocker Flow

**Given** card `aaa111` is blocked with question "Which database?"
**And** card `bbb222` is blocked with question "What auth provider?"

**When** the human views the board

**Then** both `aaa111` and `bbb222` display blocked indicators
**And** each card's detail view shows its own blocker question
**And** unblocking `aaa111` does not affect `bbb222`'s blocker state

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

## Auto-Archive

### AC-057: Card in Done for N days auto-archives (BR-002)

**Use Case:** N/A — Business Rule BR-002

**Given** card `old001.md` has `column: Done` and `updated` timestamp 31 days ago
**And** the board settings configure auto-archive interval as 30 days
**And** card `old001.md` does not have `pin: true` in frontmatter

**When** the auto-archive process runs (on heartbeat or scheduled)

**Then** card file `old001.md` is moved from `.kanban/cards/` to `.kanban/archive/`
**And** card ID `old001` is removed from the Done column in `board.yaml` cardOrder
**And** the card no longer appears on the active board

#### Cross-References
- **Business Rule:** BR-002 — Auto-Archive
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

### AC-058: Pinned card in Done is never auto-archived (BR-002 exception)

**Use Case:** N/A — Business Rule BR-002

**Given** card `pin001.md` has `column: Done` and `updated` timestamp 60 days ago
**And** card `pin001.md` has `pin: true` in frontmatter
**And** the auto-archive interval is 30 days

**When** the auto-archive process runs

**Then** card `pin001.md` remains in `.kanban/cards/` (not moved to archive)
**And** card ID `pin001` remains in the Done column in `board.yaml` cardOrder
**And** the card still appears on the active board

#### Cross-References
- **Business Rule:** BR-002 — Auto-Archive (exception for pinned cards)
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-059: Card in Done within threshold is not archived

**Use Case:** N/A — Business Rule BR-002

**Given** card `new001.md` has `column: Done` and `updated` timestamp 15 days ago
**And** the auto-archive interval is 30 days

**When** the auto-archive process runs

**Then** card `new001.md` remains in `.kanban/cards/`
**And** card ID `new001` remains in the Done column in `board.yaml` cardOrder

#### Cross-References
- **Business Rule:** BR-002 — Auto-Archive

---

### AC-060: Auto-archive interval is configurable

**Use Case:** N/A — Business Rule BR-002

**Given** `board.yaml` settings include `autoArchiveDays: 14`

**When** a card has been in Done for 15 days

**Then** the card is auto-archived (respecting the configured 14-day interval, not the 30-day default)

#### Cross-References
- **Business Rule:** BR-002 — Auto-Archive
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

## Cross-Repo Dashboard

### AC-061: Dashboard aggregates cards across all configured repos

**Use Case:** UC-005 — Human Views Cross-Repo Dashboard

**Given** `projects.yaml` lists 5 repos
**And** each repo has `.kanban/` with varying numbers of cards (3, 7, 12, 0, 20)

**When** the dashboard loads

**Then** 5 project cards are displayed
**And** each project card shows the correct total card count (3, 7, 12, 0, 20)
**And** the repo with 0 cards shows a valid project card with 0% completion

#### Cross-References
- **Schema Entity:** ProjectConfig — [schemas.md#projectconfig](schemas.md#projectconfig)

---

### AC-062: Dashboard handles repos with no .kanban/ directory

**Use Case:** UC-005 — Human Views Cross-Repo Dashboard

**Given** `projects.yaml` lists repo "NewProject" at a valid path
**And** the repo exists but has no `.kanban/` directory

**When** the dashboard loads

**Then** "NewProject" is displayed with an "uninitialized" or "no board" status
**And** the remaining repos load and display normally

#### Cross-References
- **Schema Entity:** ProjectConfig — [schemas.md#projectconfig](schemas.md#projectconfig)

---

### AC-063: Dashboard scales to 10 repos without degradation

**Use Case:** UC-005 — Human Views Cross-Repo Dashboard

**Given** `projects.yaml` lists 10 repos, each with `.kanban/` directories and up to 50 cards each

**When** the dashboard loads

**Then** all 10 project cards render with their health summaries
**And** the dashboard loads without perceptible delay or timeout

#### Cross-References
- **Business Rule:** NFR-006 — Scale (<10 repos in projects.yaml)

---

## CMS Read-Only Verification

### AC-064: CMS has no write-capable UI elements

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS ops dashboard is fully loaded

**When** inspecting every interactive element on the page

**Then** there are no "Edit", "Delete", "Create", "Move", "Unblock", or "Add" buttons
**And** there are no text input fields, text areas, or form submission elements
**And** there are no drag-and-drop zones for card manipulation
**And** the only interactive elements are navigation, scrolling, and WebSocket/SSE connection management

#### Cross-References
- **Business Rule:** A-008 — CMS is read-only

---

### AC-065: CMS makes no write API calls

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS dashboard is loaded and actively streaming data

**When** monitoring all network requests from the CMS

**Then** all HTTP requests are GET, WebSocket, or SSE connections
**And** no POST, PUT, PATCH, or DELETE requests are made to AgentDispatch or any backend
**And** no file write operations are initiated from the CMS

#### Cross-References
- **Business Rule:** A-008 — CMS is read-only
- **Business Rule:** KB-019 — CMS Read-Only

---

### AC-066: CMS blocked items section is view-only

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS dashboard displays blocked cards with their blocker questions

**When** the human views the blocked items section

**Then** the blocker question text is displayed in read-only format
**And** there is no "Unblock" button or response text area
**And** blocked items display a message directing the user to resolve blockers via VS Code, Slack, or Vivian

#### Cross-References
- **Wireframe:** `cms-ops.json#blocked_items` -> `cms-ops.json`
- **Business Rule:** A-008 — CMS is read-only

---

### AC-067: WIP limits are display-only and not enforced (BR-003)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** the Building column has a WIP limit of 3
**And** the Building column currently contains 4 cards

**When** the board renders

**Then** the Building column header displays the WIP limit indicator (e.g., "4/3")
**And** the WIP limit indicator uses a warning style (e.g., red text or exclamation) to signal the limit is exceeded
**And** agents are not prevented from adding more cards to the column
**And** humans are not prevented from dragging cards into the column

#### Cross-References
- **Business Rule:** BR-003 — WIP Limits Display Only
- **Schema Entity:** Column — [schemas.md#column](schemas.md#column)

---

## UX Completeness

### AC-068: Board displays loading skeleton during initial read (KB-028)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** a `.kanban/` directory exists with 30+ card files and adapter data sources

**When** the human opens the kanban board view in VS Code

**Then** a loading skeleton is displayed immediately showing column outlines and placeholder card shapes
**And** a spinner or progress indicator is visible
**And** once all card files and adapter data are read, the skeleton is replaced with the fully rendered board
**And** the transition from skeleton to full board is not jarring (fade or swap)

#### Cross-References
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)
- **Business Rule:** NFR-001 — Board Responsiveness

---

### AC-069: CMS dashboard shows connecting state during WebSocket handshake (KB-029)

**Use Case:** UC-006 — Human Views CMS Live Operations Dashboard

**Given** the CMS dashboard page is loaded and authenticated

**When** the WebSocket connection to AgentDispatch is being established

**Then** the dashboard displays "Connecting to AgentDispatch..." with a spinner
**And** no dashboard panels are rendered until the initial snapshot is received
**And** once connected and snapshot received, the connecting state is replaced with the live dashboard

#### Cross-References
- **API:** `WS /dashboard/ws` — [api-contracts.md#51-websocket-connection](api-contracts.md#51-websocket-connection--dashboardws)

---

### AC-070: Drag-and-drop shows undo toast for 5 seconds (KB-030)

**Use Case:** UC-008 — Human Drags Card Between Columns

**Given** the human has dragged card `abc123` from Building to Done

**When** the drop completes

**Then** a toast notification appears at the bottom of the board: "Moved abc123 to Done — Undo"
**And** the "Undo" link is clickable for 5 seconds
**And** clicking "Undo" reverts the card to the Building column (updates both card file and board.yaml)
**And** after 5 seconds without clicking, the toast auto-dismisses and the move is permanent

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-071: Card creation form validates required fields (KB-031)

**Use Case:** UC-007 — Human Creates a Card Manually

**Given** the card creation form is displayed

**When** the human submits the form with an empty title field

**Then** the submission is blocked (button disabled or form prevented from submitting)
**And** an inline validation error is displayed below the title field: "Title is required"
**And** a character counter shows "0/200" next to the title field
**And** the character counter updates as the human types and turns red near the limit

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-072: Unblock button is disabled when response is empty (KB-032)

**Use Case:** UC-002 — Human Unblocks a Card

**Given** card `blk001` is blocked and the card detail view is open
**And** the response text area is empty

**When** the human views the blocker section

**Then** the "Unblock" button is visually disabled (grayed out, not clickable)
**And** a hint text is displayed: "Enter your response to unblock this card"
**And** the "Unblock" button becomes enabled only when the text area contains non-whitespace text

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-073: Board provides search bar that filters cards by title (KB-033)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** the board has 30 cards across 7 columns

**When** the human types "auth" in the search bar

**Then** only cards whose title contains "auth" (case-insensitive) remain fully visible
**And** non-matching cards are dimmed or hidden
**And** the search filters in real-time as the human types (no submit button needed)
**And** clearing the search bar restores all cards to full visibility

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-074: Board provides filter controls for column, priority, label, and blocked status (KB-033)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** the board has cards with varying priorities, labels, and blocked statuses

**When** the human activates the filter dropdown and selects "priority: high"

**Then** only cards with `priority: high` are displayed
**And** multiple filters can be combined (e.g., priority: high AND label: security)
**And** a "blocked only" toggle shows only cards with non-empty blockers
**And** active filters are displayed as removable chips above the board

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-075: Cards are movable via keyboard shortcuts (KB-034)

**Use Case:** UC-008 — Human Drags Card Between Columns

**Given** a card `abc123` in the Building column has keyboard focus

**When** the human presses Alt+Right Arrow

**Then** card `abc123` moves to the Testing column (next column to the right)
**And** the card file frontmatter `column` is updated to `Testing`
**And** `board.yaml` cardOrder is updated
**And** a screen reader announcement is made: "Card abc123 moved to Testing"
**And** the undo toast appears (same as drag-and-drop undo per KB-030)

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)
- **Business Rule:** NFR — Accessibility, Keyboard navigation

---

### AC-076: Alt+Up/Down reorders cards within a column via keyboard (KB-034)

**Use Case:** UC-008 — Human Drags Card Between Columns

**Given** the Building column contains cards `abc123`, `def456`, `ghi789` in order
**And** card `ghi789` has keyboard focus

**When** the human presses Alt+Up Arrow

**Then** card `ghi789` moves up one position: column order becomes `abc123`, `ghi789`, `def456`
**And** `board.yaml` cardOrder for Building is updated
**And** a screen reader announcement is made: "Card ghi789 moved up to position 2"

#### Cross-References
- **Schema Entity:** Board — [schemas.md#board](schemas.md#board)

---

### AC-077: Blocked cards use icon alongside color indicator (KB-035)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** card `blk001` has a non-empty `blockers` list

**When** the board renders

**Then** card `blk001` displays a warning triangle icon alongside the warning color border
**And** the blocked state is perceivable by a user who cannot distinguish colors
**And** the icon has an ARIA label: "Blocked"

#### Cross-References
- **Schema Entity:** Card — [schemas.md#card](schemas.md#card)

---

### AC-078: Labels use icon prefix alongside color (KB-035)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** a card has labels `["bug", "security"]`

**When** the board renders the card

**Then** each label badge displays a small icon or shape prefix alongside its background color
**And** different label categories have distinguishable icons (e.g., bug uses a bug icon, security uses a shield icon)
**And** label meaning is perceivable without relying solely on color

#### Cross-References
- **Schema Entity:** Label — [schemas.md#label](schemas.md#label)

---

### AC-079: WIP exceeded indicator uses icon alongside color (KB-035)

**Use Case:** UC-001 — Human Views SDLC Board

**Given** the Building column has a WIP limit of 3 and currently contains 4 cards

**When** the board renders

**Then** the Building column header displays "4/3" with an exclamation icon alongside red/warning text
**And** the WIP exceeded state is perceivable without relying solely on color

#### Cross-References
- **Schema Entity:** Column — [schemas.md#column](schemas.md#column)

---

## Traceability Matrix

| Requirement | Acceptance Criteria |
|-------------|-------------------|
| KB-001 | AC-001 |
| KB-002 | AC-002, AC-006 |
| KB-003 | AC-003, AC-049 |
| KB-004 | AC-009 |
| KB-005 | AC-010 |
| KB-006 | AC-011 |
| KB-007 | AC-014 |
| KB-008 | AC-015, AC-038 |
| KB-009 | AC-016, AC-024 |
| KB-010 | AC-020 |
| KB-011 | AC-021 |
| KB-012 | AC-022, AC-055 |
| KB-013 | AC-025, AC-061 |
| KB-014 | AC-026 |
| KB-015 | AC-027, AC-053 |
| KB-016 | AC-028 |
| KB-017 | AC-029 |
| KB-018 | AC-030 |
| KB-019 | AC-031, AC-065 |
| KB-020 | AC-032, AC-033 |
| KB-021 | AC-036 |
| KB-022 | AC-039, AC-040 |
| KB-023 | AC-037 |
| KB-024 | AC-041 |
| KB-025 | AC-042 |
| KB-026 | AC-044 |
| KB-027 | AC-045 |
| KB-028 | AC-068 |
| KB-029 | AC-069 |
| KB-030 | AC-070 |
| KB-031 | AC-071 |
| KB-032 | AC-072 |
| KB-033 | AC-073, AC-074 |
| KB-034 | AC-075, AC-076 |
| KB-035 | AC-077, AC-078, AC-079 |
