# Kanban Dashboard — Changelog

## v0.1.0 — 2026-02-20

**Status:** Draft

- Created spec via `/spec-new`
- Requirements gathered through 6-round interview
- Schemas designed: 6 entities, board.yaml + card format
- State machines: card lifecycle (8 states), blocker state, CMS connection
- API contracts: 7 integration surfaces (VS Code, CLI, AgentDispatch, CMS, Vivian, Slack, adapters)
- 67 acceptance criteria covering 9 use cases
- NFRs: performance, security, scalability, reliability, observability, accessibility
- Glossary: 27 canonical terms across 5 domains
- 8 key decisions documented
- 5 open questions identified

## Review — 2026-02-20

**Reviewers:** security-reviewer, ux-reviewer, consistency-checker
**Verdict:** BLOCKED

- 15 blockers, 29 warnings, 13 suggestions
- Security: 4 blockers (credentials, plaintext transport, path traversal, Slack webhook)
- UX: 8 blockers (loading states, undo, validation, search/filter, accessibility)
- Consistency: 3 blockers (Note.type missing, GET /ops undefined, note heading format)
- See [review.md](review.md) for full findings

## Refinement — 2026-02-20

**Scope:** All 15 review blockers addressed via `/spec-refine`

### Consistency Fixes (CON-B-001, CON-B-002, CON-B-003)
- Added `type` field (NoteType enum) to Note entity in schemas.md
- Added CMS HTTP entry point `GET /ops` (section 5.0) to api-contracts.md
- Fixed AC-032/AC-033 cross-references to point to new section
- Standardized note heading format to `### {timestamp} — {author} [type]` (em dash + type tag) in schemas.md

### Security Fixes (SEC-B-001, SEC-B-002, SEC-B-003, SEC-B-004)
- Added credential management section (8.1): env vars, bcrypt hashing, fail-closed behavior
- Added transport security section (8.2): documented LAN-only accepted risk
- Added path traversal prevention section (8.3): allowlists + containment checks for specRef, ralphFeature, ProjectConfig.path
- Added Slack webhook signature verification section (8.4): HMAC-SHA256, 5-min timestamp window
- Updated nfr.md security table with all four fixes
- Added validation rules to schemas.md for specRef and ralphFeature

### UX Fixes (UX-B-001 through UX-B-008)
- Added 8 new requirements (KB-028 through KB-035): loading states, undo, form validation, search/filter, keyboard movement, non-color indicators
- Added 12 new acceptance criteria (AC-068 through AC-079) with cross-references
- Updated traceability matrix
- Updated nfr.md accessibility table for keyboard nav details and non-color indicators

## Wireframes — 2026-02-20

**Generated via** `/spec-wireframe kanban-dashboard`
**Platform:** web (VS Code webview + CMS browser dashboard)

- 9 screens, 484 total nodes, Cyber-Industrial dark theme
- VS Code: board-view (153 nodes), card-detail (68), card-create-form (40), dashboard-view (50), board-empty-state (11), board-error-state (12)
- CMS: cms-ops (107 nodes), cms-login (17), cms-offline (26)
- 5 behavior sidecars (board-view, card-detail, card-create-form, cms-ops, cms-login)
- 19 navigation edges, 12 data models, 37 node traces + 9 screen traces
- 36 PNG screenshots across 4 form factors (phone portrait/landscape, tablet portrait/landscape)
- Review blocker UX fixes incorporated: loading skeleton, undo toast, form validation, search/filter, keyboard hints, non-color indicators

## Re-Review — 2026-02-20

**Reviewers:** security-reviewer, ux-reviewer, consistency-checker
**Verdict:** PASS WITH WARNINGS

- All 15 original blockers verified resolved
- 3 new minor findings: 1 toolchain (blank screenshots), 2 consistency (AC cross-ref gaps)
- 25 warnings, 10 suggestions carried forward for implementation tracking
- Security: 0 new blockers, 2 new warnings (startsWith bypass, login form mechanism)
- UX: 1 toolchain blocker (PSCanvas blank screenshots), 5 warnings
- Consistency: 2 minor blockers (AC-075 cross-ref, spec-trace node ref), 8 warnings
- See [review.md](review.md) for full findings

## Diagrams — 2026-02-20

- 9 Mermaid diagrams added to [diagrams.md](diagrams.md)
- System architecture, card lifecycle, SDLC sequence, blocker flow, CMS connection, card format, adapters, deployment, CMS events
