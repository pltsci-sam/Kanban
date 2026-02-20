# Kanban Dashboard Requirements

## Problem Statement

The AIFactory ecosystem (SPECOPS, AgentDispatch, Vivian, ChartFlow, PSCanvas, CMS) operates as an autonomous SDLC pipeline, but there is no unified visual surface for humans to observe SDLC state, steer priorities, or unblock agent work. Agents drive development across multiple systems with isolated state stores (`.specops/state.json`, `.ralph/features.json`, Vivian's SQLite, AgentDispatch's DB), forcing humans to check 4+ systems to understand what's happening.

## Business Value

| Dimension | Current | Target | Metric |
|-----------|---------|--------|--------|
| Time to see full SDLC state | 5-10 min (check 4 systems) | <30 seconds | Single board view |
| Blocked task resolution | Hours (wait for Slack) | Minutes (see immediately) | Time from block to unblock |
| Agent visibility | None (see results only) | Real-time tool call stream | CMS alive indicator |
| Cross-project awareness | Manual repo-by-repo check | Single dashboard | projects.yaml aggregation |

## Spec Type

- **Type**: fullstack
- **Has UI**: yes (VS Code extension + CMS web dashboard)
- **Has Workers**: no
- **Has Event Contracts**: yes (AgentDispatch WebSocket events consumed by CMS)
- **Has Integration Contracts**: yes (AgentDispatch API, Vivian API, file I/O adapters)

## Personas

### Human Developer (Sam)
- **Role**: System operator, project lead, human-in-the-loop
- **Goals**: See SDLC state at a glance, unblock stuck agents quickly, reprioritize work, add context to tasks
- **Pain Points**: Must check AgentDispatch DB, `.specops/` files, Slack notifications, and Vivian logs separately. No single view of "what's building right now."

### AgentDispatch (Orchestrator)
- **Role**: Autonomous SDLC orchestrator running 24/7 on the NUC
- **Goals**: Read kanban state to discover work, write card state as tasks progress, block cards when human input needed
- **Pain Points**: Currently only reads `.specops/state.json`. No shared state format that humans can also edit.

### SPECOPS Agents (SDLC Tooling)
- **Role**: Specialist agents (requirements analyst, schema designer, security reviewer, etc.)
- **Goals**: Record milestone notes on cards as spec/build phases complete
- **Pain Points**: Currently write to `.ralph/` and `.specops/` only — no human-visible activity record per task.

### Vivian (Comms Layer)
- **Role**: Voice AI assistant in meetings, Slack adapter for async comms
- **Goals**: Create cards from meeting action items, announce blockers, share status
- **Pain Points**: Meeting decisions and action items stay in Vivian's SQLite — don't flow into the SDLC pipeline.

### Slack Adapter
- **Role**: Async communication channel for requests and status updates
- **Goals**: Create tasks via Slack commands, receive blocker notifications, share board status
- **Pain Points**: Currently only receives notifications — no bidirectional kanban integration.

## Use Cases

### UC-001: Human Views SDLC Board

**Actor:** Human Developer

**Preconditions:**
1. VS Code is open with the Kanban extension installed
2. A `.kanban/` directory exists in the current workspace repo

**Trigger:** Human opens `board.yaml` in VS Code or activates the Kanban panel

### Main Flow

| Step | Action |
|:----:|--------|
| 1 | Human opens the kanban board view in VS Code. |
| 2 | Extension reads `.kanban/board.yaml` and all files in `.kanban/cards/`. |
| 3 | Extension renders the board with SDLC-aligned columns (Backlog, Spec Creation, Spec Review, Building, Testing, Human Review, Done). |
| 4 | Extension reads adapter data sources (`.ralph/features.json`, `.specops/state.json`, `specs/*/open-questions.md`) to enrich card display. |
| 5 | Extension displays enriched cards with priority indicators, labels, assignee, and SDLC status from adapters. |
| 6 | Human scans the board to understand current pipeline state. |

### Alternative Flows

**AF-001.1: No .kanban/ directory exists**
- At step 2, if `.kanban/` does not exist:
  1. Extension displays an empty state with "Initialize Board" button
  2. Human clicks initialize
  3. Extension creates `.kanban/board.yaml` with default SDLC columns and empty `cards/` directory
  4. Resume at step 3

**AF-001.2: Adapter data sources unavailable**
- At step 4, if `.ralph/` or `.specops/` directories don't exist:
  1. Extension renders cards without SDLC enrichment
  2. Cards display core data only (title, column, priority, labels)

### Exception Flows

**EF-001.1: Malformed board.yaml**
- At step 2, if `board.yaml` fails schema validation:
  1. Extension displays error: "Board configuration is invalid: {validation error}"
  2. Extension offers "Open board.yaml in editor" action
  3. Human fixes the file manually

**EF-001.2: Malformed card file**
- At step 2, if a card `.md` file fails frontmatter parsing:
  1. Extension logs warning and skips the malformed card
  2. Extension displays warning indicator: "1 card skipped (parse error)"

### Postconditions
1. Human has a visual understanding of full SDLC pipeline state
2. Board reflects current state of all `.kanban/cards/` files

### Linked Requirements

| Requirement | Description |
|-------------|-------------|
| KB-001 | Board renders SDLC-aligned columns from board.yaml |
| KB-002 | Cards display enriched data from adapter sources |
| KB-003 | Board loads responsively for <50 cards |

---

### UC-002: Human Unblocks a Card

**Actor:** Human Developer

**Preconditions:**
1. A card exists with a blocker (blocker field in frontmatter or blocker note in body)
2. Human has the information needed to resolve the blocker

**Trigger:** Human sees a blocked card on the board (visual indicator) or receives Slack notification

### Main Flow

| Step | Action |
|:----:|--------|
| 1 | Human identifies a blocked card on the kanban board. |
| 2 | Human clicks the card to open its detail view. |
| 3 | Extension displays card details including blocker question from the agent. |
| 4 | Human adds a note with the answer/context via the card editor. |
| 5 | Human removes the blocker (clicks "Unblock" or removes blocker from frontmatter). |
| 6 | Extension writes updated card file to disk (frontmatter + appended note). |
| 7 | Extension updates board.yaml if column changed. |

### Alternative Flows

**AF-002.1: Unblock via Slack**
- Instead of step 1-5 on the board:
  1. Human replies to the Slack blocker thread with answer
  2. AgentDispatch receives Slack reply
  3. AgentDispatch writes answer as card note and removes blocker
  4. Card file updated on disk

**AF-002.2: Unblock via Vivian**
- Instead of step 1-5 on the board:
  1. Human says "Vivian, unblock {card title} — {answer}"
  2. Vivian writes answer as card note and removes blocker via file I/O
  3. Card file updated on disk

### Postconditions
1. Card no longer has a blocker
2. Agent note appended with human's answer
3. Card `updated` timestamp refreshed
4. AgentDispatch picks up unblocked card on next heartbeat

### Linked Requirements

| Requirement | Description |
|-------------|-------------|
| KB-004 | Blocked cards display visual indicator (icon + pulsing) |
| KB-005 | Card detail view shows blocker question and allows inline response |
| KB-006 | Unblock action writes to card file and removes blocker from frontmatter |

---

### UC-003: Agent Creates a Card

**Actor:** AgentDispatch

**Preconditions:**
1. AgentDispatch heartbeat detects a new feature in `.specops/state.json` or receives a task creation request
2. Target repo has a `.kanban/` directory

**Trigger:** HeartbeatService tick or API request (Vivian/Slack)

### Main Flow

| Step | Action |
|:----:|--------|
| 1 | AgentDispatch identifies a new work item (from heartbeat, Vivian, or Slack). |
| 2 | AgentDispatch generates a 6-character alphanumeric card ID. |
| 3 | AgentDispatch creates `.kanban/cards/{id}.md` with YAML frontmatter (title, column: Backlog, priority, labels, created timestamp). |
| 4 | AgentDispatch appends the card ID to the appropriate column in `board.yaml` cardOrder. |
| 5 | AgentDispatch commits the changes to git. |

### Alternative Flows

**AF-003.1: Card created from Vivian meeting action item**
- At step 1, Vivian calls AgentDispatch API with action item details
- Card frontmatter includes `source: vivian` and `meeting: {meeting title}`

**AF-003.2: Card created from Slack command**
- At step 1, Slack `/dispatch task` command triggers card creation
- Card frontmatter includes `source: slack`

**AF-003.3: No .kanban/ directory in target repo**
- At step 2, if `.kanban/` doesn't exist:
  1. AgentDispatch initializes `.kanban/` with default SDLC board
  2. Resume at step 2

### Postconditions
1. New card file exists in `.kanban/cards/`
2. Card ID listed in board.yaml cardOrder under target column
3. Git commit created with card creation

### Linked Requirements

| Requirement | Description |
|-------------|-------------|
| KB-007 | AgentDispatch can create kanban cards via file I/O |
| KB-008 | Card IDs are 6-character lowercase alphanumeric |
| KB-009 | Card creation triggers git commit |

---

### UC-004: Agent Moves a Card Through SDLC

**Actor:** AgentDispatch / SPECOPS Agent

**Preconditions:**
1. Card exists in a non-terminal column
2. Agent has completed the work for the current phase

**Trigger:** SPECOPS agent emits completion signal (`<promise>PHASE_COMPLETE</promise>`)

### Main Flow

| Step | Action |
|:----:|--------|
| 1 | Agent completes phase work (e.g., spec creation, build phase, verification). |
| 2 | Agent appends a milestone note to the card body (phase summary, files modified, test results). |
| 3 | Agent updates card frontmatter: column moves to next SDLC phase column. |
| 4 | Agent updates card `updated` timestamp. |
| 5 | Agent moves card ID in board.yaml cardOrder from old column to new column. |
| 6 | Agent commits changes to git. |

### Alternative Flows

**AF-004.1: Agent blocks during phase**
- At step 1, if agent cannot proceed:
  1. Agent adds blocker to card frontmatter (`blockers` list)
  2. Agent appends blocker note to card body with the question
  3. Card stays in current column
  4. AgentDispatch sends Slack notification
  5. Vivian announces blocker if in a meeting

**AF-004.2: Verification fails**
- At step 1, if spec-verify finds acceptance criteria failures:
  1. Agent appends failure note with details
  2. Card stays in Testing column (does not advance)
  3. Agent may retry or block for human review

### Postconditions
1. Card is in the next SDLC column
2. Milestone note appended with phase summary
3. Card `updated` timestamp refreshed
4. Git commit records the transition

### Linked Requirements

| Requirement | Description |
|-------------|-------------|
| KB-010 | Agents can move cards between columns via file I/O |
| KB-011 | Agent milestone notes include phase summary and file list |
| KB-012 | Blocker flow adds blocker to frontmatter and notifies all channels |

---

### UC-005: Human Views Cross-Repo Dashboard

**Actor:** Human Developer

**Preconditions:**
1. VS Code Kanban extension is installed
2. `projects.yaml` is configured with AIFactory ecosystem repos

**Trigger:** Human opens the cross-repo dashboard panel in VS Code

### Main Flow

| Step | Action |
|:----:|--------|
| 1 | Human opens the cross-repo dashboard view in VS Code. |
| 2 | Extension reads `projects.yaml` to get list of configured repos. |
| 3 | For each repo, extension reads `.kanban/board.yaml` and `.ralph/features.json` (if present). |
| 4 | Extension computes per-project health summary (total cards, completion %, phase, last activity). |
| 5 | Extension renders project cards with progress bars and status indicators. |
| 6 | Human scans dashboard to understand ecosystem health. |

### Alternative Flows

**AF-005.1: Repo path not found**
- At step 3, if a configured repo path doesn't exist:
  1. Extension displays that project as "offline" with last known state
  2. Continue processing remaining repos

### Postconditions
1. Human sees aggregated health of all AIFactory projects
2. Dashboard shows which projects have active work, blockers, or are idle

### Linked Requirements

| Requirement | Description |
|-------------|-------------|
| KB-013 | Cross-repo dashboard reads projects.yaml for repo list |
| KB-014 | Per-project summary shows completion %, phase, last activity |
| KB-015 | Dashboard handles missing repos gracefully |

---

### UC-006: Human Views CMS Live Operations Dashboard

**Actor:** Human Developer

**Preconditions:**
1. CMS dashboard is running on the NUC
2. AgentDispatch is running and has active/recent agent sessions
3. Human has authenticated with basic auth

**Trigger:** Human navigates to the CMS ops dashboard URL in a browser

### Main Flow

| Step | Action |
|:----:|--------|
| 1 | Human navigates to CMS dashboard URL (e.g., http://192.168.68.69:3000/ops). |
| 2 | CMS authenticates via basic auth. |
| 3 | CMS establishes WebSocket connection to AgentDispatch at `/dashboard/ws`. |
| 4 | CMS establishes SSE connections to active agent thinking streams at `/agents/{id}/thinking`. |
| 5 | CMS renders pipeline overview (column counts from kanban state). |
| 6 | CMS renders active agent panels with streaming tool calls. |
| 7 | CMS renders blocked items with blocker questions. |
| 8 | CMS renders recent completions feed. |
| 9 | Dashboard updates in real-time as events arrive via WebSocket/SSE. |

### Alternative Flows

**AF-006.1: No active agents**
- At step 6, if no agents are currently running:
  1. CMS displays "No active agents" with last activity timestamp
  2. Recent completions feed still populated

**AF-006.2: AgentDispatch unreachable**
- At step 3, if WebSocket connection fails:
  1. CMS displays "AgentDispatch offline" banner
  2. CMS retries connection every 10 seconds
  3. Static kanban state still displayed from last known state

### Postconditions
1. Human sees real-time agent activity (tool calls, thinking, progress)
2. Dashboard feels "alive" with streaming updates and animations
3. Blocked items are prominently displayed

### Linked Requirements

| Requirement | Description |
|-------------|-------------|
| KB-016 | CMS connects to AgentDispatch WebSocket for real-time events |
| KB-017 | CMS streams agent tool calls with timestamps and animations |
| KB-018 | CMS displays pipeline overview with column counts |
| KB-019 | CMS is read-only (no write actions) |
| KB-020 | CMS authenticates via basic auth |

---

### UC-007: Human Creates a Card Manually

**Actor:** Human Developer

**Preconditions:**
1. Kanban board is open in VS Code
2. Human wants to add a work item not generated by agents

**Trigger:** Human clicks "Add Card" button or uses Claude Code `/kanban add` command

### Main Flow

| Step | Action |
|:----:|--------|
| 1 | Human clicks "Add Card" on a column header or uses CLI. |
| 2 | Extension displays card creation form (title, description, priority, labels). |
| 3 | Human enters card details and confirms. |
| 4 | Extension generates 6-character card ID. |
| 5 | Extension creates `.kanban/cards/{id}.md` with frontmatter and description body. |
| 6 | Extension appends card ID to target column in board.yaml cardOrder. |
| 7 | Board re-renders with new card. |

### Alternative Flows

**AF-007.1: Card created via Claude Code skill**
- Instead of step 1-3:
  1. Human says "add a card for {title}" to Claude Code
  2. Kanban skill writes card file and updates board.yaml
  3. VS Code file watcher triggers board re-render

### Postconditions
1. New card exists in `.kanban/cards/`
2. Card appears on the board in the target column
3. Card has `source: manual` in frontmatter

### Linked Requirements

| Requirement | Description |
|-------------|-------------|
| KB-021 | VS Code extension provides card creation UI |
| KB-022 | Claude Code skill can create cards via file write |
| KB-023 | Card creation form captures title, description, priority, labels |

---

### UC-008: Human Drags Card Between Columns

**Actor:** Human Developer

**Preconditions:**
1. Kanban board is displayed in VS Code
2. Card exists in a non-terminal column

**Trigger:** Human drags a card from one column to another

### Main Flow

| Step | Action |
|:----:|--------|
| 1 | Human clicks and drags a card from source column to target column. |
| 2 | Extension updates card frontmatter: `column` field set to target column name. |
| 3 | Extension updates card `updated` timestamp. |
| 4 | Extension moves card ID in board.yaml cardOrder from source to target column. |
| 5 | Board re-renders with card in new position. |

### Postconditions
1. Card is in the target column
2. Card file and board.yaml updated on disk
3. AgentDispatch picks up column change on next heartbeat

### Linked Requirements

| Requirement | Description |
|-------------|-------------|
| KB-024 | Drag-and-drop between columns updates card file and board.yaml |
| KB-025 | Drag-and-drop within a column reorders cards in board.yaml |

---

### UC-009: Vivian Creates Card from Meeting Action Item

**Actor:** Vivian

**Preconditions:**
1. Vivian is in a meeting
2. Human creates an action item via voice command

**Trigger:** Human says "Vivian, create a task for {description}"

### Main Flow

| Step | Action |
|:----:|--------|
| 1 | Human issues voice command to create a task. |
| 2 | Vivian extracts task details (title, optional priority, optional assignee). |
| 3 | Vivian writes `.kanban/cards/{id}.md` in the target repo via file I/O. |
| 4 | Vivian appends card ID to Backlog column in board.yaml. |
| 5 | Vivian confirms: "Created card {title} in backlog." |

### Alternative Flows

**AF-009.1: Target repo ambiguous**
- At step 3, if multiple repos are configured:
  1. Vivian asks "Which project?" or infers from meeting context
  2. Human confirms target repo

### Postconditions
1. Card exists in target repo's `.kanban/cards/`
2. Card has `source: vivian` and `meeting: {title}` in frontmatter
3. Card ID in board.yaml cardOrder under Backlog

### Linked Requirements

| Requirement | Description |
|-------------|-------------|
| KB-026 | Vivian can create kanban cards via file I/O |
| KB-027 | Cards from Vivian include meeting metadata |

---

## Functional Requirements

### KB-001: SDLC Board Rendering
- **Description**: Board renders SDLC-aligned columns from board.yaml configuration
- **Acceptance Criteria**: Board displays all configured columns with correct names, ordering, and WIP limits
- **Priority**: Must Have
- **Traces To**: UC-001

### KB-002: Card Enrichment from Adapters
- **Description**: Cards display data from .ralph/, .specops/, and spec artifacts at render time
- **Acceptance Criteria**: When .ralph/features.json contains a matching feature, card shows build progress; when specs/*/open-questions.md has items, card shows question count
- **Priority**: Should Have
- **Traces To**: UC-001

### KB-003: Responsive Board Loading
- **Description**: Board loads responsively for typical workloads (<50 cards)
- **Acceptance Criteria**: Board renders within a reasonable time for 50 cards with adapter enrichment
- **Priority**: Must Have
- **Traces To**: UC-001

### KB-004: Blocked Card Indicator
- **Description**: Cards with blockers display a prominent visual indicator
- **Acceptance Criteria**: Blocked cards show a distinct icon and styling (e.g., warning color, pulsing) visible at board level
- **Priority**: Must Have
- **Traces To**: UC-002

### KB-005: Card Detail View with Blocker Response
- **Description**: Card detail view shows blocker question and allows inline human response
- **Acceptance Criteria**: Clicking a blocked card shows the agent's question and provides a text area for the human's answer
- **Priority**: Must Have
- **Traces To**: UC-002

### KB-006: Unblock Action
- **Description**: Unblock action writes answer to card file and removes blocker from frontmatter
- **Acceptance Criteria**: After unblock, card file has no blockers in frontmatter, human note is appended, updated timestamp is refreshed
- **Priority**: Must Have
- **Traces To**: UC-002

### KB-007: Agent Card Creation via File I/O
- **Description**: AgentDispatch can create kanban cards by writing .kanban/ files directly
- **Acceptance Criteria**: AgentDispatch writes valid card .md file and updates board.yaml atomically
- **Priority**: Must Have
- **Traces To**: UC-003

### KB-008: Card ID Generation
- **Description**: Card IDs are 6-character lowercase alphanumeric strings
- **Acceptance Criteria**: Generated IDs match pattern `^[a-z0-9]{6}$` and are unique within the board
- **Priority**: Must Have
- **Traces To**: UC-003, UC-007

### KB-009: Git Commit on Card Changes (Agent)
- **Description**: Agent card operations trigger git commits
- **Acceptance Criteria**: After agent creates/moves/updates a card, a git commit is created with descriptive message
- **Priority**: Must Have
- **Traces To**: UC-003, UC-004

### KB-010: Agent Card Movement
- **Description**: Agents can move cards between columns via file I/O
- **Acceptance Criteria**: Agent updates card frontmatter column field and board.yaml cardOrder atomically
- **Priority**: Must Have
- **Traces To**: UC-004

### KB-011: Agent Milestone Notes
- **Description**: Agent notes include phase summary and file list (milestone + phase level)
- **Acceptance Criteria**: Notes include: phase name, files created/modified, test results summary
- **Priority**: Must Have
- **Traces To**: UC-004

### KB-012: Multi-Channel Blocker Notification
- **Description**: When an agent blocks, notification sent via Slack, card visual indicator, and Vivian (if in meeting)
- **Acceptance Criteria**: Blocked card has frontmatter blocker, Slack thread created, Vivian announces if active meeting
- **Priority**: Must Have
- **Traces To**: UC-004

### KB-013: Cross-Repo Dashboard
- **Description**: Dashboard reads projects.yaml and aggregates status across all configured repos
- **Acceptance Criteria**: Dashboard shows per-project health summary for all repos in projects.yaml
- **Priority**: Should Have
- **Traces To**: UC-005

### KB-014: Per-Project Summary
- **Description**: Each project in the dashboard shows completion %, current phase, last activity date
- **Acceptance Criteria**: Summary computed from .kanban/ cards and .ralph/ features data
- **Priority**: Should Have
- **Traces To**: UC-005

### KB-015: Graceful Missing Repo Handling
- **Description**: Dashboard handles repos that are offline or missing
- **Acceptance Criteria**: Missing repos show "offline" status instead of crashing the dashboard
- **Priority**: Should Have
- **Traces To**: UC-005

### KB-016: CMS WebSocket Connection
- **Description**: CMS connects to AgentDispatch WebSocket for real-time event streaming
- **Acceptance Criteria**: CMS establishes and maintains WebSocket to AgentDispatch /dashboard/ws with auto-reconnect
- **Priority**: Must Have
- **Traces To**: UC-006

### KB-017: CMS Agent Activity Stream
- **Description**: CMS streams agent tool calls with timestamps and visual indicators
- **Acceptance Criteria**: Active agent panels show scrolling tool call feed with spinning indicator, timestamp, and tool name
- **Priority**: Must Have
- **Traces To**: UC-006

### KB-018: CMS Pipeline Overview
- **Description**: CMS displays pipeline column counts from kanban state
- **Acceptance Criteria**: Pipeline bar shows card counts per SDLC column, updates in real-time
- **Priority**: Must Have
- **Traces To**: UC-006

### KB-019: CMS Read-Only
- **Description**: CMS dashboard is read-only — no write actions
- **Acceptance Criteria**: No buttons, forms, or interactions that modify kanban state, agent state, or any data
- **Priority**: Must Have
- **Traces To**: UC-006

### KB-020: CMS Basic Auth
- **Description**: CMS dashboard authenticates via basic HTTP auth
- **Acceptance Criteria**: Unauthenticated requests receive 401, valid credentials grant access
- **Priority**: Must Have
- **Traces To**: UC-006

### KB-021: VS Code Card Creation UI
- **Description**: Extension provides UI for creating new cards
- **Acceptance Criteria**: "Add Card" button on column headers opens form; card created on submit
- **Priority**: Must Have
- **Traces To**: UC-007

### KB-022: Claude Code Kanban Skill
- **Description**: Claude Code skill enables card CRUD via natural language
- **Acceptance Criteria**: Skill can create, list, move, update, and archive cards via file operations
- **Priority**: Must Have
- **Traces To**: UC-007

### KB-023: Card Creation Fields
- **Description**: Card creation captures title, description, priority, labels
- **Acceptance Criteria**: Created card file has all provided fields in frontmatter
- **Priority**: Must Have
- **Traces To**: UC-007

### KB-024: Drag-and-Drop Between Columns
- **Description**: Drag-and-drop moves cards between columns, updating files
- **Acceptance Criteria**: Card file column field and board.yaml cardOrder updated on drop
- **Priority**: Must Have
- **Traces To**: UC-008

### KB-025: Drag-and-Drop Reorder Within Column
- **Description**: Drag-and-drop reorders cards within a column
- **Acceptance Criteria**: board.yaml cardOrder list for the column reflects new order
- **Priority**: Should Have
- **Traces To**: UC-008

### KB-026: Vivian Card Creation
- **Description**: Vivian can create kanban cards from meeting action items
- **Acceptance Criteria**: Voice command creates valid card file with meeting metadata
- **Priority**: Should Have
- **Traces To**: UC-009

### KB-027: Meeting Metadata on Cards
- **Description**: Cards created from Vivian include source and meeting title
- **Acceptance Criteria**: Card frontmatter includes `source: vivian` and `meeting: {title}`
- **Priority**: Should Have
- **Traces To**: UC-009

### KB-028: Board Loading State
- **Description**: VS Code board displays a skeleton/spinner while reading card files and running adapter enrichment
- **Acceptance Criteria**: Loading indicator appears immediately on board open; skeleton columns shown; full render replaces skeleton when ready
- **Priority**: Must Have
- **Traces To**: UC-001

### KB-029: CMS Dashboard Loading State
- **Description**: CMS dashboard shows a connecting/loading indicator during initial WebSocket handshake
- **Acceptance Criteria**: "Connecting to AgentDispatch..." message with spinner shown until first snapshot received
- **Priority**: Must Have
- **Traces To**: UC-006

### KB-030: Drag-and-Drop Undo
- **Description**: Accidental card moves via drag-and-drop can be undone within a short time window
- **Acceptance Criteria**: 5-second undo toast appears after every drag-and-drop move; clicking "Undo" reverts the card to its previous column; toast auto-dismisses after 5 seconds and the move becomes permanent
- **Priority**: Must Have
- **Traces To**: UC-008

### KB-031: Card Creation Form Validation
- **Description**: Card creation form enforces required fields and displays validation errors
- **Acceptance Criteria**: Title field is marked required; empty title submission is prevented; character counter shown for title (max 200); validation error displayed inline below the field
- **Priority**: Must Have
- **Traces To**: UC-007

### KB-032: Unblock Empty-Submit Prevention
- **Description**: The "Unblock" button requires non-empty response text before submitting
- **Acceptance Criteria**: "Unblock" button is disabled when the response text area is empty; visual hint indicates text is required
- **Priority**: Must Have
- **Traces To**: UC-002

### KB-033: Board Search and Filter
- **Description**: VS Code board provides search/filter to find cards on a 50-card board
- **Acceptance Criteria**: Search bar filters cards by title text (real-time); filter controls for column, priority, label, and blocked status; matching cards highlighted, non-matching dimmed or hidden
- **Priority**: Must Have
- **Traces To**: UC-001

### KB-034: Keyboard Card Movement
- **Description**: Cards can be moved between columns using keyboard shortcuts (WCAG 2.1.1)
- **Acceptance Criteria**: Focus a card with Tab; Alt+Left/Right moves card to adjacent column; Alt+Up/Down reorders within column; screen reader announces the move; no mouse required for any card operation
- **Priority**: Must Have
- **Traces To**: UC-008

### KB-035: Non-Color State Indicators
- **Description**: All state indicators use icons alongside color (WCAG 1.4.1 — color not sole indicator)
- **Acceptance Criteria**: Blocked cards show warning triangle icon (not just color); labels display a dot or icon prefix alongside color; WIP exceeded shows exclamation icon alongside red text; priority uses icon prefix (e.g., arrow-up for high) alongside color
- **Priority**: Must Have
- **Traces To**: UC-001, UC-002

## Non-Functional Requirements

### NFR-001: Board Responsiveness
- **Category**: Performance
- **Target**: Board feels responsive for <50 cards per board
- **Measurement**: No perceptible lag on card operations

### NFR-002: File I/O Safety
- **Category**: Reliability
- **Target**: Card writes are atomic — no partial file states
- **Measurement**: Write-then-rename pattern for all file operations

### NFR-003: Git Friendliness
- **Category**: Maintainability
- **Target**: Kanban files produce clean, reviewable git diffs
- **Measurement**: Card edits produce <20 line diffs, no array rewriting in board.yaml

### NFR-004: CMS Dashboard Auth
- **Category**: Security
- **Target**: Basic HTTP auth required for all CMS dashboard access
- **Measurement**: 401 returned for unauthenticated requests

### NFR-005: CMS WebSocket Resilience
- **Category**: Reliability
- **Target**: CMS auto-reconnects to AgentDispatch WebSocket within 10 seconds
- **Measurement**: Connection loss → reconnect → stream resumes without page reload

### NFR-006: Scale
- **Category**: Scalability
- **Target**: <50 cards per board, <10 repos in projects.yaml
- **Measurement**: No degradation at target scale

## Business Rules

### BR-001: SDLC Column Ordering
- **Rule**: Default SDLC columns are ordered: Backlog → Spec Creation → Spec Review → Building → Testing → Human Review → Done
- **Source**: SPECOPS SDLC pipeline phases
- **Exceptions**: Custom boards may have different columns

### BR-002: Auto-Archive
- **Rule**: Cards in "Done" column are automatically moved to `archive/` directory after N days (configurable, default 30)
- **Source**: Keep active board clean
- **Exceptions**: Cards with `pin: true` in frontmatter are never auto-archived

### BR-003: WIP Limits Display Only
- **Rule**: WIP limits are displayed as visual indicators but not enforced (agents can exceed)
- **Source**: Agents should not be blocked by WIP limits
- **Exceptions**: None

### BR-004: Card Ownership
- **Rule**: Kanban card files are the source of truth for task identity and status. SDLC enrichment (ralph progress, spec status) comes from adapters at display time — not duplicated in cards.
- **Source**: Round 3 interview decision
- **Exceptions**: Cards may store lightweight references (specRef, ralphFeature) for adapter lookups

## Data Entities (Preliminary)

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| Board | name, columns[], labels[], cardOrder{}, settings | Contains Cards |
| Card | id, title, column, priority, labels[], assignee, created, updated, due, blockers[], source | Belongs to Board |
| Column | name, wipLimit, done (bool), description | Contains Cards (via cardOrder) |
| Label | name, color | Applied to Cards |
| ProjectConfig | name, path, adapters[] | Listed in projects.yaml |
| Note | timestamp, author, content | Appended to Card body |

## Assumptions

| ID | Assumption | Status | Source |
|----|-----------|--------|--------|
| A-001 | Kanban files (.kanban/) are committed to git in each repo | CONFIRMED | Round 6 |
| A-002 | AgentDispatch runs on NUC with direct file access to all repos | CONFIRMED | Round 6 |
| A-003 | CMS dashboard runs on NUC (not Cloud Run for now) | CONFIRMED | Round 6 |
| A-004 | One board per repo, cross-repo view only in the Kanban project | CONFIRMED | Round 6 |
| A-005 | AIFactory monorepo will be created before implementation phase | CONFIRMED | Round 6 |
| A-006 | CMS is brought into the monorepo and modified for ops dashboard | CONFIRMED | Round 6 |
| A-007 | AgentDispatch reads/writes .kanban/ files directly (file I/O, not API) | CONFIRMED | Round 4 |
| A-008 | CMS is read-only — actions happen via Vivian, Slack, or AgentDispatch dashboard | CONFIRMED | Round 2 |
| A-009 | Existing AgentDispatch WebSocket/SSE endpoints are sufficient for CMS streaming | CONFIRMED | Round 4 |
| A-010 | Blocker notifications go to all channels (Slack + card + Vivian) | CONFIRMED | Round 4 |

## Open Questions

| ID | Question | Owner | Deadline | Impact |
|----|----------|-------|----------|--------|
| OQ-001 | What is the monorepo structure for AIFactory? Which projects go where? | Sam | Before implementation | Blocks directory structure decisions |
| OQ-002 | Should the CMS ops dashboard be a separate Astro route or a standalone app? | Sam | Phase 6 | Affects CMS modifications |
| OQ-003 | How should board.yaml handle concurrent writes from multiple agents? | Engineering | Phase 3 | File locking or last-write-wins |
| OQ-004 | What is the auto-archive interval default (30 days proposed)? | Sam | Phase 1 | Configurable, just need default |
| OQ-005 | Should the Slack adapter create cards directly, or go through AgentDispatch? | Sam | Phase 4 | Affects Slack integration architecture |

## Out of Scope

- Sprint/iteration management (future consideration)
- Burndown charts and velocity metrics (future consideration)
- Multi-user authentication and RBAC on the kanban board
- Mobile/tablet-optimized views
- Real-time collaborative editing (git handles sync)
- Card-level permissions or access control
- Integration with non-AIFactory projects (configurable opt-in later)
- Swimlanes (use labels + filtering instead)
