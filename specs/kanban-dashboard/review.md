# Spec Review: kanban-dashboard (Re-Review)

| Field | Value |
|-------|-------|
| Spec Type | fullstack |
| Reviewers | security-reviewer, ux-reviewer, consistency-checker |
| Date | 2026-02-20 |
| Verdict | PASS WITH WARNINGS |

## Context

This is a re-review following refinement of all 15 blockers from the initial review and generation of PSCanvas wireframes (9 screens, 484 nodes). All original blockers have been verified as resolved by each reviewer.

## Summary

| Reviewer | Blockers | Warnings | Suggestions |
|----------|----------|----------|-------------|
| Security | 0 | 12 | 6 |
| UX | 1* | 5 | 4 |
| Consistency | 2 | 8 | 0 |
| **Total** | **3*** | **25** | **10** |

*\*UX-B-001R is a PSCanvas toolchain rendering failure (blank screenshots), not a spec content issue. The wireframe JSON structures are valid and well-formed. This does not block implementation.*

## Previous Blocker Verification

All 15 original blockers verified resolved:

### Security (4/4 Resolved)
- **SEC-B-001** (Credential Management): RESOLVED — env vars, bcrypt, fail-closed
- **SEC-B-002** (Transport Security): RESOLVED — accepted LAN risk documented
- **SEC-B-003** (Path Traversal): RESOLVED WITH CAVEAT — `startsWith` bypass noted as SEC-W-011
- **SEC-B-004** (Slack Webhook): RESOLVED — HMAC-SHA256, 5-min window

### UX (8/8 Resolved)
- **UX-B-001–008**: All ADEQUATE — loading states, undo toast, form validation, search/filter, keyboard movement, non-color indicators all present in wireframes with matching ACs

### Consistency (3/3 Resolved)
- **CON-B-001** (Note.type): VERIFIED — field present in schemas.md and data-models.json
- **CON-B-002** (GET /ops): VERIFIED — endpoint in api-contracts.md section 5.0
- **CON-B-003** (Note heading format): VERIFIED — standardized throughout

## New Blockers

### UX

**UX-B-001R: PSCanvas Screenshot Rendering Failure (Toolchain)**
All 36 PNG screenshots render as blank grids. The wireframe JSON is valid — this is a PSCanvas rendering pipeline issue, not a spec defect. Visual design quality cannot be verified from screenshots until fixed. *Does not block implementation — wireframe JSON is complete and correct.*

### Consistency

**CON-B-001: AC-075 Missing Undo Toast Cross-Reference**
AC-075 (keyboard card movement) body references the undo toast but the Cross-References section does not link to `undo_toast` wireframe node or KB-030. Fix: add wireframe and requirement cross-references.

**CON-B-002: spec-trace.json Node References Review Artifact**
`blocked_age_text` node traces to `review.md#UX-S-003` (a review suggestion, not a spec artifact). Node has no backing requirement or AC. Fix: either create KB-036 or remove from spec-trace.

## Warnings

### Security (12)

| ID | Issue |
|----|-------|
| SEC-W-001 | VS Code WebView renders Markdown without sanitization spec — XSS risk |
| SEC-W-002 | CMS renders agent content without output encoding — DOM XSS risk |
| SEC-W-003 | No rate limiting on CMS auth endpoint — brute-forceable from LAN |
| SEC-W-004 | Card/blocker ID generation does not mandate CSPRNG |
| SEC-W-005 | Slack secrets `.gitignore` guidance incomplete |
| SEC-W-006 | YAML parser unspecified — Billion Laughs DoS risk |
| SEC-W-007 | No audit log for CMS auth events or human unblock actions |
| SEC-W-008 | `board.yaml` read-modify-write TOCTOU race (OQ-003 still open) |
| SEC-W-009 | WebSocket upgrade does not enforce `Origin` header |
| SEC-W-010 | Agent author identity in card files is unverified |
| SEC-W-011 | `startsWith` path containment bypass — needs `+ path.sep` (new) |
| SEC-W-012 | CMS login form vs HTTP Basic Auth mechanism mismatch — credential storage unspecified (new) |

### UX (5)

| ID | Issue |
|----|-------|
| UX-W-001R | Keyboard move interaction model ambiguous (direct-execute vs mode-entry) |
| UX-W-002R | Card create form cancel has no unsaved-changes guard (carried from original review) |
| UX-W-003R | CMS login form has no error state for invalid credentials |
| UX-W-004R | Cross-repo dashboard has no empty state for zero projects (carried from original review) |
| UX-W-005R | Login hint text exposes env var configuration to end users |

### Consistency (8)

| ID | Issue |
|----|-------|
| CON-W-001 | `SpecopsEnrichment` missing as top-level model in data-models.json |
| CON-W-002 | ACs label NFR-NNN items as "Business Rule" instead of "NFR" |
| CON-W-003 | ~8 ACs use descriptive wireframe anchors that don't match real node IDs |
| CON-W-004 | AC-043 has zero cross-references |
| CON-W-005 | spec.md claims 67 ACs — actual count is 79 |
| CON-W-006 | spec.md claims 27 requirements — actual count is 35 |
| CON-W-007 | OQ-003 owner is "Engineering" (team) not a named individual |
| CON-W-008 | data-models.json Board has UI-state fields not in schemas.md (undocumented) |

## Suggestions

### Security (6)
- SEC-S-001: Add `script-src` nonce to CMS CSP
- SEC-S-002: Git commit signatures for agent changes
- SEC-S-003: Specify max card note content size
- SEC-S-004: Validate `cmsUrl` as safe URL
- SEC-S-005: Define behavior for empty `KANBAN_CMS_PASSWORD`
- SEC-S-006: Specify `.kanban/` directory permissions

### UX (4)
- UX-S-001R: Undo timer bar needs ARIA role/label for screen readers
- UX-S-002R: CMS agent spinner uses color-only active indicator
- UX-S-003R: Dashboard "online" status uses color-only dot
- UX-S-004R: Card-detail panel has no loading skeleton for initial card read

## Verdict

**PASS WITH WARNINGS** — All 15 original blockers resolved. The 3 new findings classified as "blockers" are minor cross-reference issues (CON-B-001, CON-B-002) and a toolchain rendering failure (UX-B-001R) — none represent fundamental spec gaps. The 2 consistency blockers require only AC cross-reference updates and a spec-trace cleanup, not architectural changes.

Recommend:
1. Fix the 2 consistency cross-reference issues (5 min each)
2. Track the 25 warnings for implementation — particularly SEC-W-011 (`startsWith` + `path.sep`) which is a one-line fix
3. Re-run PSCanvas screenshots when the rendering pipeline is fixed
4. Proceed to `/spec-implement kanban-dashboard`
