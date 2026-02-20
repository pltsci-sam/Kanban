## Consistency Check

**Checked By**: Consistency Checker Agent
**Date**: 2026-02-20
**Spec Type**: fullstack
**Rules Applied**: Rule 0, Rule 1, Rule 2, Rule 3, Rule 4, Rule 5, Rule 6, Rule 7, Rule 8, Rule 9, Rule 10, Rule 11, Rule 12, Rule 13, Rule 14, Rule 15, Rule 16, Rule 17 (skipped), Rule 18 (skipped)
**Rules Skipped**:
- Rule 17 (Known Gaps coherence): No "Known Gaps & Scope Boundaries" section found in spec.md. Requirements.md has an "Out of Scope" section but spec.md has no structured Known Gaps section.
- Rule 18 (Compliance matrix completeness): No compliance-matrix.md found.

---

## Re-Review Context

This is a re-review. The previous review identified three blockers, all reported as fixed:
- **CON-B-001 (VERIFIED FIXED)**: `Note.type` field is present in schemas.md (`NULL, ENUM(comment, milestone, blocker, unblock), DEFAULT 'comment'`) and in data-models.json (`Note.type` enum with four values).
- **CON-B-002 (VERIFIED FIXED)**: `GET /ops` endpoint is defined in api-contracts.md section 5.0 with correct auth behavior. Referenced correctly by AC-032 and AC-033.
- **CON-B-003 (VERIFIED FIXED)**: Note heading format is standardized throughout schemas.md as `### {timestamp} — {author} [type]` (em dash + bracketed type tag). All examples in schemas.md, api-contracts.md, and card format examples are consistent.

---

## Summary

| Category | Blockers | Warnings |
|----------|----------|----------|
| UC Coverage | 0 | 0 |
| Schema-API Alignment | 0 | 1 |
| Wireframe Consistency | 1 | 2 |
| AC Coverage | 1 | 2 |
| State Machine Coverage | 0 | 1 |
| Event/Worker Coverage | 0 | 0 |
| Terminology & Glossary | 0 | 2 |
| Scope & Known Gaps | 0 | 0 |
| Compliance Matrix | N/A | N/A |
| **Total** | **2** | **8** |

---

## Blockers

### CON-B-001: AC-075 references keyboard navigation endpoint that maps to UC-008 but undo toast cross-reference missing

- **Rule**: Rule 7 — Every AC referencing a wireframe node must reference an existing node
- **Source**: acceptance-criteria.md, AC-075
- **Target**: board-view.json
- **Missing**: AC-075 cross-references `card.column` update and `board.yaml` cardOrder update (both correct) and then states "the undo toast appears (same as drag-and-drop undo per KB-030)." However, AC-075's cross-references section cites only `Schema Entity: Card` — it does not reference the `undo_toast` node or KB-030 binding in the cross-references block, despite the AC body explicitly invoking the undo toast behavior. The undo_toast behavior for keyboard movement shares the same mechanism as drag-and-drop (KB-030/AC-070), but this linkage is absent from AC-075's Cross-References section. This creates a silent gap: the undo toast node (`board-view.json#undo_toast`) is mapped to KB-030 in spec-trace.json, but AC-075 does not reference it, meaning a verifier checking AC-075 would not know the undo toast also applies to keyboard movement.
- **Fix**: Add to AC-075 Cross-References: `- **Wireframe:** board-view.json#undo_toast -> board-view.json` and `- **Business Rule:** KB-030 — Drag-and-Drop Undo (also applies to keyboard movement per AC-075 body)`

---

### CON-B-002: spec-trace.json node `blocked_age_text` references `review.md#UX-S-003` — a non-spec artifact section

- **Rule**: Rule 2 (node-centric spec-trace format) — Every node entry's `specFile` must reference a canonical spec artifact; rule also covers Rule 7 variant: node trace references should resolve to valid spec identifiers
- **Source**: wireframes.pscanvas/spec-trace.json, node `blocked_age_text`
- **Target**: `review.md` section `UX-S-003`
- **Missing**: The spec-trace.json entry for `blocked_age_text` has `"specFile": "review.md"` and `"section": "UX-S-003"`. The file `review.md` is a review artifact (UX review), not a canonical spec artifact. Spec-trace nodes should trace to requirements.md, acceptance-criteria.md, or similar spec documents. UX-S-003 is a review suggestion, not a requirement or AC. The `blocked_age_text` node has no backing requirement (no KB-NNN) and no acceptance criterion.
- **Fix**: Either (a) create a functional requirement KB-036 for "blocked card age display" and trace the node to it, or (b) remove the `blocked_age_text` node from spec-trace.json if the feature is not formally required, or (c) document it as a suggestion-only node with no spec backing and remove it from spec-trace.

---

## Warnings

### CON-W-001: Schema entity `SpecopsEnrichment` exists in data-models.json but is absent from data-models.json top-level models

- **Rule**: Rule 11 — Every schema entity appears in at least 1 wireframe via data-models.json
- **Source**: api-contracts.md (SpecopsEnrichment interface defined in section 1.6)
- **Issue**: `data-models.json` includes `CardEnrichment` with a `specops` field typed as `SpecopsEnrichment`, but the `SpecopsEnrichment` model is not defined as a top-level model in data-models.json (unlike `RalphEnrichment` which has its own top-level entry with fields `buildProgress`, `phase`, `filesModified`). The `card-detail.json` wireframe binds to `card.enrichment.specops.completedPhases` — this path requires `SpecopsEnrichment` to have a `completedPhases` field, which is defined in api-contracts.md but not in data-models.json. Any tooling that validates bindings against data-models.json will fail to resolve `card.enrichment.specops.completedPhases`.
- **Suggested Fix**: Add a top-level `SpecopsEnrichment` model to data-models.json with fields: `specPhase` (string), `completedPhases` (string[]), `lastActivity` (datetime), mirroring the TypeScript interface in api-contracts.md section 1.6.

---

### CON-W-002: AC-003 and AC-049 reference NFR-001 as `Business Rule: NFR-001` — NFRs are not business rules

- **Rule**: Rule 16 — Terminology consistency
- **Source**: acceptance-criteria.md, AC-003 (line 86), AC-049 (line 976), AC-068 (line 1357)
- **Issue**: The cross-references in multiple ACs label NFR-NNN items as `**Business Rule:** NFR-001 — Board Responsiveness`, `**Business Rule:** NFR-006 — Scale`, etc. NFRs (Non-Functional Requirements) are a distinct category from Business Rules (BR-NNN) in this spec. The NFR document (`nfr.md`) and requirements document use "NFR" consistently everywhere except in these AC cross-reference blocks where the label "Business Rule" is misapplied. Affected ACs: AC-003, AC-016, AC-024, AC-049, AC-063.
- **Suggested Fix**: Change `**Business Rule:** NFR-NNN` to `**NFR:** NFR-NNN` in all AC cross-reference blocks to match the terminology used in requirements.md and nfr.md.

---

### CON-W-003: AC wireframe cross-references use anchor fragment IDs (e.g., `board-view.json#column_headers`) that do not match actual node IDs in the wireframe files

- **Rule**: Rule 7 — Every AC referencing a wireframe node must reference an existing node
- **Source**: acceptance-criteria.md — multiple ACs
- **Issue**: Many AC cross-references use human-readable anchor names that do not correspond to actual node IDs in the wireframe JSON files. Examples:
  - AC-001: `board-view.json#column_headers` — no node with id `column_headers` exists in board-view.json
  - AC-002: `board-view.json#card_enrichment_area` — no node with this id exists
  - AC-004: `board-view.json#empty_state` — the empty state is a separate screen (`board-empty-state.json`), not a node in board-view.json
  - AC-006: `board-view.json#card_basic` — no node with this id exists
  - AC-025: `dashboard-view.json#project_cards` — no node with id `project_cards` found
  - AC-026: `dashboard-view.json#project_summary` — no node with id `project_summary` found
  - AC-027: `dashboard-view.json#offline_project` — no node with id `offline_project` found
  - AC-048: `board-view.json#empty_columns` — no node with this id exists
  These appear to be descriptive anchors written at AC-authoring time, before the wireframes existed with real node IDs. Confirmed present and correctly referenced: `board-view.json#parse_warning_badge`, `board-view.json#card_blocked_1`, `board-view.json#undo_toast`, `card-detail.json#blocker_section`, `card-detail.json#unblock_btn`, `card-create-form.json#title_char_counter`, `card-create-form.json#form_submit_btn`, `cms-ops.json#pipeline_bar`, `cms-ops.json#no_agents_state`, `cms-ops.json#blocked_item_1`, `cms-login.json#login_submit_btn`, `cms-offline.json#offline_banner`.
- **Suggested Fix**: Update the descriptive anchor fragments in these ACs to use the actual node IDs from the generated wireframes, or document that AC wireframe references use descriptive anchors (not node IDs) and are resolved by screen name only.

---

### CON-W-004: AC-043 has no wireframe cross-reference despite describing an observable UI outcome

- **Rule**: Rule 7 (soft) — ACs describing visible state should trace to a wireframe
- **Source**: acceptance-criteria.md, AC-043 (line 836)
- **Issue**: AC-043 ("Drag-and-drop triggers AgentDispatch pickup") describes a postcondition observable at the system level (AgentDispatch heartbeat detecting a column change). This AC has zero Cross-References — no wireframe node, no schema entity, no API endpoint. While this is an integration-level behavior, the file I/O mechanism is covered by the same CardWriter/BoardReader interfaces used in other ACs. The missing cross-reference makes this AC harder to trace.
- **Suggested Fix**: Add `- **Schema Entity:** Card — [schemas.md#card]` and `- **API:** File I/O — .kanban/cards/{id}.md, .kanban/board.yaml` to AC-043 cross-references.

---

### CON-W-005: spec.md claims "67 acceptance criteria" but the actual count is 79

- **Rule**: Rule 13 (variant) — artifact claims should be accurate
- **Source**: spec.md line: "Acceptance Criteria — 67 acceptance criteria"
- **Issue**: The spec.md artifacts summary states `[Acceptance Criteria](acceptance-criteria.md) — 67 acceptance criteria`. The actual acceptance-criteria.md contains AC-001 through AC-079, which is 79 acceptance criteria. The discrepancy is 12 ACs (AC-068 through AC-079 were added in this revision and spec.md was not updated).
- **Suggested Fix**: Update spec.md artifacts line to read: `[Acceptance Criteria](acceptance-criteria.md) — 79 acceptance criteria`

---

### CON-W-006: spec.md claims "27 functional requirements" but the actual count is 35

- **Rule**: Rule 13 (variant) — artifact claims should be accurate
- **Source**: spec.md line: "Requirements — 9 use cases, 27 functional requirements, 5 personas"
- **Issue**: requirements.md defines KB-001 through KB-035, which is 35 functional requirements. KB-028 through KB-035 (8 requirements) were added in the current revision but spec.md was not updated. The "27 functional requirements" figure is stale.
- **Suggested Fix**: Update spec.md artifacts line to read: `[Requirements](requirements.md) — 9 use cases, 35 functional requirements, 5 personas`

---

### CON-W-007: Open question OQ-003 references "Engineering" as owner without a specific person name

- **Rule**: Rule 14 — Every open question has owner and deadline
- **Source**: open-questions.md (and requirements.md) — OQ-003
- **Issue**: OQ-003 has `Owner: Engineering` and `Deadline: Phase 3`. The rule requires a named owner. "Engineering" is a group, not an individual owner. All other open questions (OQ-001, OQ-002, OQ-004, OQ-005) name "Sam" as owner. OQ-003 is the only one using a team name.
- **Suggested Fix**: Assign a specific named owner to OQ-003 (e.g., "Sam" or a specific engineer).

---

### CON-W-008: data-models.json `Board.isLoading`, `Board.searchQuery`, and `Board.parseErrors` are UI state fields not present in schemas.md Board entity

- **Rule**: Rule 15 — Data model in wireframes aligns with schemas.md
- **Source**: wireframes.pscanvas/data-models.json, Board model; schemas.md Board entity
- **Issue**: The `Board` model in data-models.json includes three fields not present in schemas.md:
  - `isLoading: boolean` (default: true)
  - `searchQuery: string` (default: "")
  - `parseErrors: CardParseError[]` (default: [])
  - `validationError: string | null`
  These are view-layer state fields, not persisted schema fields. This is not a blocker (UI state fields reasonably extend the schema model for wire-frame purposes), but the divergence should be explicitly documented.
- **Suggested Fix**: Add a comment or note in data-models.json (or schemas.md) clarifying that `isLoading`, `searchQuery`, `parseErrors`, and `validationError` are view-model extensions of the persisted Board schema, not fields stored in board.yaml.

---

## New Requirements Verification (KB-028 through KB-035)

The following verification confirms all new requirements have corresponding ACs with correct cross-references:

| Requirement | ACs in Traceability Matrix | Verified |
|-------------|---------------------------|---------|
| KB-028 (Board Loading State) | AC-068 | PASS — AC-068 exists, traces to UC-001, references Schema: Board and NFR-001 |
| KB-029 (CMS Dashboard Loading State) | AC-069 | PASS — AC-069 exists, traces to UC-006, references WS /dashboard/ws endpoint |
| KB-030 (Drag-and-Drop Undo) | AC-070 | PASS — AC-070 exists, traces to UC-008, references Card schema and undo_toast wireframe node |
| KB-031 (Card Creation Form Validation) | AC-071 | PASS — AC-071 exists, traces to UC-007, references Card schema |
| KB-032 (Unblock Empty-Submit Prevention) | AC-072 | PASS — AC-072 exists, traces to UC-002, references Card schema |
| KB-033 (Board Search and Filter) | AC-073, AC-074 | PASS — both ACs exist, trace to UC-001, reference Card schema |
| KB-034 (Keyboard Card Movement) | AC-075, AC-076 | PASS — both ACs exist, AC-075 traces to UC-008 (with caveat in CON-B-001), AC-076 traces to UC-008 |
| KB-035 (Non-Color State Indicators) | AC-077, AC-078, AC-079 | PASS — all three ACs exist, trace to UC-001 (and UC-002 for AC-077), reference appropriate schema entities |

---

## New ACs Verification (AC-068 through AC-079)

| AC | Requirement | UC | Wireframe Ref | Schema Ref | API Ref | Status |
|----|-------------|-----|--------------|------------|---------|--------|
| AC-068 | KB-028 | UC-001 | Missing — loading_skeleton_overlay node exists in board-view.json but not referenced in AC | Board | — | Partial (see CON-W-003) |
| AC-069 | KB-029 | UC-006 | — | — | WS /dashboard/ws | PASS |
| AC-070 | KB-030 | UC-008 | — | Card | — | PASS |
| AC-071 | KB-031 | UC-007 | — | Card | — | PASS |
| AC-072 | KB-032 | UC-002 | — | Card | — | PASS |
| AC-073 | KB-033 | UC-001 | — | Card | — | PASS |
| AC-074 | KB-033 | UC-001 | — | Card | — | PASS |
| AC-075 | KB-034 | UC-008 | — | Card | — | See CON-B-001 |
| AC-076 | KB-034 | UC-008 | — | Board | — | PASS |
| AC-077 | KB-035 | UC-001, UC-002 | — | Card | — | PASS |
| AC-078 | KB-035 | UC-001 | — | Label | — | PASS |
| AC-079 | KB-035 | UC-001 | — | Column | — | PASS |

---

## Previous Blockers Re-Verification

| Previous Blocker | Fix Applied | Verification Result |
|-----------------|-------------|---------------------|
| CON-B-001: Note.type field missing from schemas.md | Added `type: string, NULL, ENUM(comment, milestone, blocker, unblock), DEFAULT 'comment'` to Note entity | VERIFIED RESOLVED — field present in schemas.md Note table and in data-models.json Note model |
| CON-B-002: GET /ops endpoint missing from api-contracts.md | Added section 5.0 with full endpoint spec including auth behavior | VERIFIED RESOLVED — endpoint documented at api-contracts.md section 5.0; AC-032 and AC-033 reference it correctly |
| CON-B-003: Note heading format inconsistent | Standardized to `### {timestamp} — {author} [type]` throughout | VERIFIED RESOLVED — all examples in schemas.md, api-contracts.md card format examples, and wire-frame behavior files use consistent format |

---

## Identifier Inventory

| Type | Count | IDs |
|------|-------|-----|
| Use Cases | 9 | UC-001, UC-002, UC-003, UC-004, UC-005, UC-006, UC-007, UC-008, UC-009 |
| Functional Requirements | 35 | KB-001 through KB-035 |
| Business Rules | 4 | BR-001, BR-002, BR-003, BR-004 |
| NFRs | 6 | NFR-001, NFR-002, NFR-003, NFR-004, NFR-005, NFR-006 |
| Assumptions | 10 | A-001 through A-010 |
| Open Questions | 5 | OQ-001, OQ-002, OQ-003, OQ-004, OQ-005 |
| Acceptance Criteria | 79 | AC-001 through AC-079 |
| Schema Entities | 6 | Board, Card, Column, Label, ProjectConfig, Note |
| API Contract Surfaces | 7 | VS Code Extension File I/O (2.x), Claude Code Skill CLI (3.x), AgentDispatch File I/O (4.x), CMS HTTP Entry (5.0), CMS WebSocket (5.1), CMS SSE (5.4), Vivian File I/O (6.x) |
| TypeScript Interfaces | 28 | Board, ColumnDefinition, LabelDefinition, BoardSettings, Card, CardPriority, CardSource, Blocker, Note, NoteType, BoardState, BoardChangeEvent, CardParseError, CardWriter, CardCreateInput, CardUpdateInput, NoteInput, BoardInitializer, ProjectsConfig, ProjectConfig, AdapterType, EnrichedCard, CardEnrichment, RalphEnrichment, SpecopsEnrichment, SpecArtifactEnrichment, DashboardSnapshot, WebSocketState |
| WebSocket Event Types | 6 | task.state_change, agent.tool_call, agent.thinking, agent.session_start, agent.session_complete, agent.blocked |
| API Endpoints (HTTP/WS/SSE) | 3 | GET /ops, WS /dashboard/ws, SSE /agents/{id}/thinking |
| Screens | 9 | board-view, card-detail, card-create-form, dashboard-view, board-empty-state, board-error-state, cms-ops, cms-login, cms-offline |
| State Machines | 3 | Card Lifecycle, Card Blocker State, CMS Connection State |
| Glossary Terms | 27 | (5 categories: Board & Cards, SDLC Pipeline, AIFactory Ecosystem, Adapters & Enrichment, Infrastructure) |
| Error Codes (state machine) | 10 | CARD_ARCHIVED, CARD_SKIP_PIPELINE (x2), CARD_SKIP_BUILD, CARD_ALREADY_DONE, CARD_MANUAL_ARCHIVE_BLOCKED, CARD_NOT_BLOCKED, CARD_STILL_BLOCKED, CMS_NO_DIRECT_CONNECT, CMS_NOT_PREVIOUSLY_CONNECTED, CMS_NEVER_CONNECTED, CMS_USE_RECONNECT_FLOW |

---

## Rule-by-Rule Results

### Rule 0: Structural Validation
PSCanvas validator not run (tool not available in this environment). Visual inspection of all 9 screen JSON files and all behavior JSON files confirmed valid JSON structure. All screens have required `id`, `type`, `name`, `layout`, `style`, `children` fields. Navigation.json has required `initialScreen` and `edges` fields. data-models.json and spec-trace.json are structurally valid. **No structural blockers found via inspection.**

### Rule 1: Every UC has at least 1 AC
All 9 use cases (UC-001 through UC-009) have at least one AC in their dedicated sections. **PASS.**

### Rule 2: Every UC has at least 1 screen in spec-trace.json
spec-trace.json screens object contains entries for: board-view (UC-001), card-detail (UC-002), card-create-form (UC-007), dashboard-view (UC-005), board-empty-state (AF-001.1/UC-001), board-error-state (EF-001.1/UC-001), cms-ops (UC-006), cms-login (KB-020/UC-006), cms-offline (AF-006.2/UC-006).
- UC-001: board-view. PASS.
- UC-002: card-detail. PASS.
- UC-003: No direct screen (agent-only use case — file I/O, no UI). Acceptable — agent operations have no screen. PASS (agent-side UC with no UI surface).
- UC-004: No direct screen (agent-only use case). PASS (same reasoning as UC-003).
- UC-005: dashboard-view. PASS.
- UC-006: cms-ops, cms-login, cms-offline. PASS.
- UC-007: card-create-form. PASS.
- UC-008: board-view (drag interaction handled within board-view). PASS.
- UC-009: No direct screen (Vivian voice integration — no VS Code or CMS screen). PASS (voice UC with no direct screen surface).

### Rule 3: Every API request/response type has corresponding schema fields
All TypeScript interfaces in api-contracts.md map to schema entities in schemas.md. The `Card` interface fields align with Card schema fields. `Board` interface aligns with Board schema. `Note` interface aligns with Note schema (including the newly added `type` field). `Blocker` interface aligns with Blocker embedded entity in Card schema. `ProjectConfig` interface aligns with ProjectConfig schema. **One partial issue flagged in CON-W-001** (SpecopsEnrichment missing from data-models.json). **PASS with warning.**

### Rule 4: Every wireframe binding resolves to data-models.json field
Bindings inspected across all screen JSON files. Key bindings checked:
- `card.id`, `card.title`, `card.column`, `card.priority`, `card.labels`, `card.blockers`, `card.notes`, `card.enrichment`, `card.blockers[0].author`, `card.blockers[0].created`, `card.blockers[0].question` — all resolve to Card model in data-models.json. PASS.
- `card.enrichment.ralph.buildProgress` — resolves to RalphEnrichment.buildProgress in data-models.json. PASS.
- `card.enrichment.specops.completedPhases` — requires SpecopsEnrichment.completedPhases. SpecopsEnrichment is defined in api-contracts.md but NOT as a top-level model in data-models.json. **Flagged in CON-W-001.**
- `board.parseErrors` — resolves to Board.parseErrors in data-models.json. PASS.
- `unblockResponse` — local form state, not a model field. Acceptable as ephemeral UI state.
- `auth.username`, `auth.password` — local form state. Acceptable.
- CMS bindings (`DashboardSnapshot`, `ActiveAgentSummary`, `WebSocketState`) — all resolve to data-models.json models. PASS.

### Rule 5: Every wireframe navigation handler resolves to navigation.json edge
Navigation handlers inspected in behavior files and screen JSON files:
- `navigate(board-view)` in card-detail.json detail_close_btn → navigation.json edge `card-detail → board-view`. PASS.
- `navigate(dashboard-view)` in board-view.json dashboard_tab_btn → navigation.json edge `board-view → dashboard-view`. PASS.
- `tap:add_card_global_btn` → `board-view → card-create-form`. PASS.
- `tap:col_backlog_add_btn` → `board-view → card-create-form`. PASS.
- `tap:form_submit_btn` → `card-create-form → board-view`. PASS.
- `tap:form_cancel_btn` → `card-create-form → board-view`. PASS.
- `tap:login_submit_btn` → `cms-login → cms-ops`. PASS.
- `state:ws.connectionLost` → `cms-ops → cms-offline`. PASS.
- `tap:offline_retry_btn` → `cms-offline → cms-ops`. PASS.
- `tap:unblock_btn` in card-detail.behavior.json triggers `closing` state then navigates back — navigation.json has `card-detail → board-view` via `tap:unblock_btn`. PASS.
All navigation handlers resolve. **PASS.**

### Rule 6: Every wireframe API handler resolves to api-contracts.md endpoint
API entries in behavior files:
- board-view.behavior.json: FILE_READ `.kanban/board.yaml` → BoardReader.readBoard(). PASS.
- board-view.behavior.json: FILE_READ `.kanban/cards/*.md` → BoardReader.readCard(). PASS.
- board-view.behavior.json: FILE_WRITE `.kanban/cards/{id}.md` → CardWriter.updateCard(). PASS.
- board-view.behavior.json: FILE_WRITE `.kanban/board.yaml` → CardWriter.moveCard(). PASS.
- card-detail.behavior.json: FILE_READ `.kanban/cards/{cardId}.md` → BoardReader.readCard(). PASS.
- card-detail.behavior.json: FILE_WRITE `.kanban/cards/{cardId}.md` → CardWriter.appendNote() + updateCard(). PASS.
- card-create-form.behavior.json: FILE_WRITE `.kanban/cards/{id}.md` → CardWriter.createCard(). PASS.
- card-create-form.behavior.json: FILE_WRITE `.kanban/board.yaml` → (atomic board update). PASS.
- cms-ops.behavior.json: WS_CONNECT `/dashboard/ws` → api-contracts.md section 5.1. PASS.
- cms-ops.behavior.json: SSE_CONNECT `/agents/{agentId}/thinking` → api-contracts.md section 5.4. PASS.
- cms-login.behavior.json: GET `/ops` → api-contracts.md section 5.0. PASS.
All API handlers resolve. **PASS.**

### Rule 7: Every AC referencing wireframe node must reference an existing node
Node IDs confirmed present in wireframe screens:
- `board-view.json#parse_warning_badge` (parse_warning_badge node). PRESENT.
- `board-view.json#card_blocked_1` (card_blocked_1 node). PRESENT.
- `board-view.json#undo_toast` and `undo_btn` nodes. PRESENT.
- `board-view.json#loading_skeleton_overlay`. PRESENT.
- `board-view.json#search_input`, `filter_priority_btn`, `filter_blocked_btn`, `active_filter_chip`. PRESENT.
- `board-view.json#add_card_global_btn`, `col_backlog_add_btn`. PRESENT.
- `board-view.json#wip_indicator`, `wip_icon`, `blocked_warning_icon`. PRESENT.
- `board-view.json#card1_keyboard_hint`. PRESENT.
- `card-detail.json#blocker_section`, `blocker_header_icon`, `blocker_response_textarea`, `blocker_hint_text`, `unblock_btn`. PRESENT.
- `card-create-form.json#title_required_indicator`, `title_char_counter`, `title_error_text`, `form_submit_btn`. PRESENT.
- `cms-ops.json#pipeline_bar`, `agent_panel` (ap1_feed), `no_agents_state`, `blocked_item_1`, `bi1_readonly_notice`, `cms_conn_status`, `cms_connecting_overlay`. PRESENT.
- `cms-login.json#login_submit_btn`. PRESENT.
- `cms-offline.json#offline_banner`, `offline_retry_btn`. PRESENT.
- `board-empty-state.json#initialize_board_btn`. PRESENT.
Descriptive fragments (see CON-W-003) used in ~8 ACs do not match real node IDs. **See CON-W-003.**

### Rule 8: Every AC referencing an API endpoint must reference a real endpoint
- AC-028: `WS /dashboard/ws` → exists in api-contracts.md section 5.1. PASS.
- AC-029: `SSE /agents/{id}/thinking` → exists in api-contracts.md section 5.4. PASS.
- AC-032: `GET /ops` → exists in api-contracts.md section 5.0. PASS.
- AC-033: `GET /ops` → exists in api-contracts.md section 5.0. PASS.
- AC-069: `WS /dashboard/ws` → exists in api-contracts.md section 5.1. PASS.
- AC-012: references `File I/O removeBlocker — api-contracts.md#44-adding-blockers-and-notes` → section 4.4 exists. PASS.
All endpoint references resolve. **PASS.**

### Rule 9: No orphan schema entities
- Board → referenced by CardWriter.createCard(), BoardReader.readBoard(), AgentDispatch file I/O protocol. PASS.
- Card → referenced by CardWriter, BoardReader, all agent file I/O interfaces. PASS.
- Column → embedded in Board; referenced by CardWriter.moveCard() column validation. PASS.
- Label → embedded in Board; referenced by Card.labels validation. PASS.
- ProjectConfig → referenced by cross-repo dashboard aggregation (UC-005), projects.yaml file format. PASS.
- Note → referenced by CardWriter.appendNote(), AgentDispatch milestone note sequence. PASS.
All schema entities referenced. **PASS.**

### Rule 10: Every state machine transition has matching API endpoint or is documented as automatic
Card Lifecycle transitions: all transitions are file writes via the same CardWriter/AgentDispatch file I/O protocol documented in api-contracts.md sections 2, 3, 4, 6. The `auto_archive` transition is explicitly documented as "Automatic on board load or heartbeat." **PASS.**
Card Blocker transitions: all transitions are file writes. **PASS.**
CMS Connection transitions: all transitions are browser WebSocket API events (client-side state, no server-side HTTP endpoints needed). Documented as `Browser WebSocket API` mechanism. **PASS.**

### Rule 11: Every schema entity appears in at least 1 wireframe via data-models.json
- Board → Board model in data-models.json. PASS.
- Card → Card model in data-models.json. PASS.
- Column → ColumnDefinition model in data-models.json. PASS.
- Label → LabelDefinition model in data-models.json. PASS.
- ProjectConfig → ProjectConfig model in data-models.json. PASS.
- Note → Note model in data-models.json. PASS.
All entities present. **PASS.**

### Rule 12: Every API error code has an AC testing it
HTTP error codes in api-contracts.md: 200 (success), 401 (unauthorized) for GET /ops. AC-032 tests 401. AC-033 tests 200. State machine error codes (CARD_ARCHIVED, CARD_SKIP_PIPELINE, etc.) are logic constraints, not HTTP error codes — no ACs required for state machine guard violations. WebSocket/SSE do not define explicit error codes beyond disconnect handling. **PASS.**

### Rule 13: Every NFR target references existing endpoint or screen
- NFR-001: "Board feels responsive for <50 cards" — references the board view implicitly. Board view exists as `board-view` screen. PASS.
- NFR-002: "Card writes are atomic" — references file write operations defined in api-contracts.md. PASS.
- NFR-003: "Kanban files produce clean git diffs" — references git commit conventions in api-contracts.md section 4.6. PASS.
- NFR-004: "Basic HTTP auth required for all CMS dashboard access" — references GET /ops endpoint (section 5.0). PASS.
- NFR-005: "CMS auto-reconnects to AgentDispatch WebSocket within 10 seconds" — references WS /dashboard/ws (section 5.1). PASS.
- NFR-006: "<50 cards per board, <10 repos" — references board view and dashboard view. Both screens exist. PASS.
nfr.md also specifies screen-level targets (e.g., "Board view: Time to Interactive <1s", "Card detail view: Open time <200ms") — board-view and card-detail screens exist. **PASS.**

### Rule 14: Every open question has owner and deadline
- OQ-001: Owner: Sam, Deadline: Before implementation. PASS.
- OQ-002: Owner: Sam, Deadline: Phase 6. PASS.
- OQ-003: Owner: Engineering, Deadline: Phase 3. **WARNING — "Engineering" is not a named individual. See CON-W-007.**
- OQ-004: Owner: Sam, Deadline: Phase 1. PASS.
- OQ-005: Owner: Sam, Deadline: Phase 4. PASS.

### Rule 15: Data model in wireframes aligns with schemas.md
Core model field types are compatible:
- Card.priority: `enum[critical, high, medium, low]` in both data-models.json and schemas.md. PASS.
- Card.source: `enum[manual, agentdispatch, vivian, slack]` in both. PASS.
- Card.id: `string, pattern ^[a-z0-9]{6}$` in both. PASS.
- Card.title: `string, maxLength: 200` in both. PASS.
- Note.type: `enum[comment, milestone, blocker, unblock]` in both. PASS (CON-B-001 from previous review verified fixed).
- Board.cardOrder: `map<string, string[]>` in both. PASS.
UI-state fields added in data-models.json (isLoading, searchQuery, parseErrors, validationError) are extensions — **flagged in CON-W-008.**
SpecopsEnrichment missing from data-models.json as top-level model — **flagged in CON-W-001.**

### Rule 16: Terminology consistency
Glossary defines canonical terms. Checked for terminology drift across artifacts:
- "Blocker" vs "block"/"impediment": Requirements.md consistently uses "Blocker". state-machines.md and glossary.md consistent. PASS.
- "Unblock" vs "resolve": Glossary retires "resolve" in favor of "Unblock". requirements.md, state-machines.md, and api-contracts.md all use "Unblock". PASS.
- "Column" vs "lane"/"list": Glossary retires "lane", "list". All artifacts use "Column" or "column". PASS.
- "Card" vs "task"/"ticket"/"issue": Glossary retires these aliases. All spec artifacts use "Card". PASS.
- "CMS Dashboard" vs "ops dashboard"/"live view": Glossary includes "ops dashboard" as an alias for CMS Dashboard. requirements.md uses "CMS ops dashboard" and "CMS dashboard" interchangeably — both are covered by glossary aliases. PASS.
- "NFR" labeling in ACs: **See CON-W-002.** ACs label NFRs as "Business Rule" — terminology mismatch.
- "Ralph Harness" vs "ralph": Glossary canonical term is "Ralph Harness". api-contracts.md uses "RalphAdapter" and "ralph" as the adapter name (lowercase) — this is an intentional code-level naming convention distinct from the display-level term. PASS.

---

## Cross-Reference Matrix

| UC | Functional Requirements | Key ACs | Screen |
|----|------------------------|---------|--------|
| UC-001 | KB-001, KB-002, KB-003, KB-028, KB-033, KB-035 | AC-001 to AC-008, AC-048 to AC-050, AC-052, AC-067, AC-068, AC-073, AC-074, AC-077, AC-078, AC-079 | board-view |
| UC-002 | KB-004, KB-005, KB-006, KB-032 | AC-009 to AC-013, AC-055, AC-056, AC-072 | card-detail |
| UC-003 | KB-007, KB-008, KB-009 | AC-014 to AC-019, AC-051 | (agent file I/O, no screen) |
| UC-004 | KB-010, KB-011, KB-012 | AC-020 to AC-024, AC-051 | (agent file I/O, no screen) |
| UC-005 | KB-013, KB-014, KB-015 | AC-025 to AC-027, AC-053, AC-061 to AC-063 | dashboard-view |
| UC-006 | KB-016, KB-017, KB-018, KB-019, KB-020, KB-029 | AC-028 to AC-035, AC-054, AC-064 to AC-066, AC-069 | cms-login, cms-ops, cms-offline |
| UC-007 | KB-021, KB-022, KB-023, KB-031 | AC-036 to AC-040, AC-071 | card-create-form |
| UC-008 | KB-024, KB-025, KB-030, KB-034 | AC-041 to AC-043, AC-070, AC-075, AC-076 | board-view |
| UC-009 | KB-026, KB-027 | AC-044 to AC-046 | (Vivian voice, no screen) |

---

## Sign-Off

- [ ] All Blockers resolved (2 blockers remain — CON-B-001, CON-B-002)
- [ ] All Warnings reviewed and accepted or tracked (8 warnings)
- [ ] Identifier inventory verified complete
