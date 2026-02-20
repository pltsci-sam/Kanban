# Consistency Report — kanban-dashboard

**Spec type:** fullstack
**Date:** 2026-02-20 (post-review-fix cross-artifact consistency check)
**Overall Status:** **PASS** (all 15 review blockers verified fixed; 2 pre-existing warnings remain)

---

## Summary

| Category | PASS | WARN | FAIL |
|----------|------|------|------|
| Review Blocker Fixes (CON-B-*) | 3 | 0 | 0 |
| Review Blocker Fixes (SEC-B-*) | 4 | 0 | 0 |
| Review Blocker Fixes (UX blockers) | 4 | 0 | 0 |
| Traceability & Cross-Ref | 4 | 0 | 0 |
| Previously Resolved Items | 12 | 0 | 0 |
| Standing Warnings | 0 | 2 | 0 |
| **Total** | **27** | **2** | **0** |

---

## 1. CON-B-001: Note.type field exists in schemas.md AND api-contracts.md

**Status:** PASS

**schemas.md** (line 423):
Note entity field table includes:
```
| type | string | NULL, ENUM(comment, milestone, blocker, unblock), DEFAULT 'comment' | Note category for filtering and display | KB-011 |
```

**api-contracts.md** (line 103):
Note interface includes:
```typescript
type?: NoteType;                 // Note category -- enum: comment, milestone, blocker, unblock
```

**api-contracts.md** (line 106):
NoteType enum defined:
```typescript
type NoteType = "comment" | "milestone" | "blocker" | "unblock";
```

**api-contracts.md** (line 444):
NoteInput interface includes:
```typescript
type?: NoteType;                 // Note category -- default: "comment"
```

All four locations agree on the field name `type`, type `NoteType`, and enum values `comment | milestone | blocker | unblock` with default `comment`. The Note.type field is present in both schemas.md and api-contracts.md.

---

## 2. CON-B-002: GET /ops endpoint defined in api-contracts.md section 5.0; AC-032/AC-033 reference it

**Status:** PASS

**api-contracts.md** (lines 1199-1228):
Section `### 5.0 CMS HTTP Entry Point -- GET /ops` is fully defined with:
- Endpoint URL: `http://{agentdispatch-host}:{port}/ops`
- Method: GET
- Auth: Basic auth (Authorization header)
- Response codes: 200 (authenticated), 401 (unauthorized)
- Full behavioral description and credential management details

**acceptance-criteria.md** (line 637):
AC-032 cross-references:
```
- **API:** `GET /ops` -- [api-contracts.md#50-cms-http-entry-point](api-contracts.md#50-cms-http-entry-point--get-ops)
```

**acceptance-criteria.md** (line 654):
AC-033 cross-references:
```
- **API:** `GET /ops` -- [api-contracts.md#50-cms-http-entry-point](api-contracts.md#50-cms-http-entry-point--get-ops)
```

Both AC-032 and AC-033 reference the `GET /ops` endpoint in section 5.0 of api-contracts.md. The endpoint is fully specified and the cross-references resolve correctly.

---

## 3. CON-B-003: Note heading format consistently uses em dash + type tag

**Status:** PASS

Expected format: `### {timestamp} --- {author} [type]`

**schemas.md** (line 157):
```
Each note is an `### {timestamp} --- {author} [type]` heading (em dash separator, bracketed type tag)
```

**schemas.md** -- all examples use correct format:
- Line 193: `### 2026-02-18T10:30:00Z --- agentdispatch [milestone]`
- Line 199: `### 2026-02-19T09:15:00Z --- specops-requirements [milestone]`
- Line 206: `### 2026-02-20T14:22:00Z --- specops-builder [milestone]`
- Line 240: `### 2026-02-17T08:00:00Z --- sam [comment]`
- Line 245: `### 2026-02-19T16:45:00Z --- specops-builder [blocker]`
- Line 444: `### 2026-02-19T09:15:00Z --- specops-requirements [milestone]`
- Line 469: `### 2026-02-20T11:00:00Z --- sam [comment]`
- Line 480: `### 2026-02-20T11:05:00Z --- sam [unblock]`

**api-contracts.md** -- all examples use correct format:
- Line 135: `### 2026-02-20T12:00:00Z --- specops-analyst [milestone]`
- Line 142: `### 2026-02-20T14:15:00Z --- specops-builder [milestone]`
- Line 1001: `### {timestamp} --- {author} [milestone]` (template)
- Line 1075: `### 2026-02-20T15:00:00Z --- specops-analyst [blocker]`
- Line 1091: `### 2026-02-20T16:00:00Z --- human [unblock]`
- Line 1599: `### {timestamp} --- vivian [comment]` (template)
- Line 1619: `### 2026-02-20T10:00:00Z --- vivian [comment]`

**state-machines.md**:
- No inline note heading examples appear in state-machines.md (transitions reference "milestone note appended" and "blocker note appended" without showing the heading format), so there is nothing to conflict.

All three artifacts consistently use the em dash separator and `[type]` tag in note headings. No instances of the old format (without type tag) remain.

---

## 4. SEC-B-001: CMS credential management section exists in api-contracts.md section 8.1

**Status:** PASS

**api-contracts.md** (lines 1901-1933):
Section `### 8.1 CMS Credential Management (SEC-B-001)` is fully specified with:
- Environment variables table: `KANBAN_CMS_USERNAME` (optional, default `ops`) and `KANBAN_CMS_PASSWORD` (required)
- Server-side startup behavior: reads env var, fail-closed if missing, bcrypt hash (cost 12), discard plaintext
- Request authentication: constant-time comparison, bcrypt.compare(), 401 response on failure
- Credential rotation procedure

**nfr.md** (line 44):
Security table row covers CMS Authentication:
```
| CMS Authentication | Basic HTTP auth via env vars (`KANBAN_CMS_USERNAME`, `KANBAN_CMS_PASSWORD`); bcrypt-hashed server-side; constant-time comparison | Request without credentials returns 401; missing env var prevents startup (fail-closed) |
```

The credential management details in api-contracts.md section 8.1 and the nfr.md security table are consistent.

---

## 5. SEC-B-002: Transport security documented in api-contracts.md section 8.2

**Status:** PASS

**api-contracts.md** (lines 1935-1957):
Section `### 8.2 Transport Security (SEC-B-002)` is fully specified with:
- Accepted risk table: LAN-only (192.168.68.0/24), NUC-to-browser, Base64 basic auth over plaintext
- Threat model documentation
- CORS restriction to LAN IP range
- Future upgrade path (self-signed TLS, ws:// to wss://)

**nfr.md** (line 45):
Security table row:
```
| CMS Transport | Plaintext HTTP/WS on LAN -- accepted risk (SEC-B-002) | CORS restricted to 192.168.68.0/24; no internet exposure |
```

Both artifacts document the same accepted risk with matching details.

---

## 6. SEC-B-003: Path traversal validation rules in schemas.md and api-contracts.md section 8.3

**Status:** PASS

**api-contracts.md** (lines 1959-1999):
Section `### 8.3 Path Traversal Prevention (SEC-B-003)` includes:
- `validateSpecRef()`: character allowlist `^[a-z0-9][a-z0-9\-\/]*$`, no `..`, resolved path within repo root
- `validateRalphFeature()`: character allowlist `^[a-z0-9][a-z0-9\-_]*$`, max length 100
- `validateProjectPath()`: absolute path required, no `..`
- Enforcement points: BoardReader, ProjectsConfig parser, Adapter enrich() methods

**schemas.md** (lines 263-264):
Card validation rules include:
```
- `specRef` MUST match `^[a-z0-9][a-z0-9\-\/]*$`, MUST NOT contain `..`, and resolved path MUST be within repo root (SEC-B-003)
- `ralphFeature` MUST match `^[a-z0-9][a-z0-9\-_]*$` (SEC-B-003)
```

**schemas.md** (line 405):
ProjectConfig validation:
```
- Every `path` MUST be an absolute filesystem path and MUST NOT contain `..` sequences (SEC-B-003)
```

**nfr.md** (line 48):
Security table row:
```
| Path traversal prevention | Character allowlist + containment check on `specRef`, `ralphFeature`, `ProjectConfig.path` (SEC-B-003) | Paths with `..` or outside repo root are rejected |
```

All three artifacts agree on the regex patterns, the `..` prohibition, and the containment check. The SEC-B-003 cross-reference tag is used consistently.

---

## 7. SEC-B-004: Slack webhook signature verification in api-contracts.md section 8.4

**Status:** PASS

**api-contracts.md** (lines 2001-2031):
Section `### 8.4 Slack Webhook Signature Verification (SEC-B-004)` includes:
- Verification protocol: read timestamp header, 5-minute replay window, HMAC-SHA256 computation, constant-time comparison
- Environment variables: `SLACK_SIGNING_SECRET` (required if Slack enabled), `SLACK_BOT_TOKEN` (required if Slack enabled)
- Fail-closed behavior: reject all webhooks if signing secret not set

**nfr.md** (line 51):
Security table row:
```
| Slack webhook auth | HMAC-SHA256 signature verification via `SLACK_SIGNING_SECRET`; 5-min timestamp window (SEC-B-004) | Unsigned or expired webhooks rejected with 401 |
```

Both artifacts agree on the verification mechanism (HMAC-SHA256), the signing secret env var, the 5-minute replay window, and the SEC-B-004 tag.

---

## 8. UX Blockers: KB-028 through KB-035 exist in requirements.md

**Status:** PASS

All 8 new requirements are present in requirements.md:

| Requirement | Line | Description | Priority |
|-------------|------|-------------|----------|
| KB-028 | 652 | Board Loading State (skeleton/spinner during read) | Must Have |
| KB-029 | 659 | CMS Dashboard Loading State (connecting indicator) | Must Have |
| KB-030 | 665 | Drag-and-Drop Undo (5-second undo toast) | Must Have |
| KB-031 | 671 | Card Creation Form Validation (required fields, char counter) | Must Have |
| KB-032 | 677 | Unblock Empty-Submit Prevention (disabled button when empty) | Must Have |
| KB-033 | 683 | Board Search and Filter (search bar, filter controls) | Must Have |
| KB-034 | 689 | Keyboard Card Movement (Alt+Arrow, WCAG 2.1.1) | Must Have |
| KB-035 | 695 | Non-Color State Indicators (icons alongside color, WCAG 1.4.1) | Must Have |

Each requirement has Description, Acceptance Criteria summary, Priority, and Traces To fields populated. All 8 trace to appropriate use cases (UC-001, UC-002, UC-006, UC-007, UC-008).

---

## 9. UX Blockers: AC-068 through AC-079 exist with correct KB cross-references

**Status:** PASS

All 12 new acceptance criteria are present in acceptance-criteria.md under the `## UX Completeness` section:

| AC | Line | KB Reference | Use Case | Title |
|----|------|-------------|----------|-------|
| AC-068 | 1342 | KB-028 | UC-001 | Board displays loading skeleton during initial read |
| AC-069 | 1361 | KB-029 | UC-006 | CMS dashboard shows connecting state during WebSocket handshake |
| AC-070 | 1378 | KB-030 | UC-008 | Drag-and-drop shows undo toast for 5 seconds |
| AC-071 | 1396 | KB-031 | UC-007 | Card creation form validates required fields |
| AC-072 | 1414 | KB-032 | UC-002 | Unblock button is disabled when response is empty |
| AC-073 | 1432 | KB-033 | UC-001 | Board provides search bar that filters cards by title |
| AC-074 | 1450 | KB-033 | UC-001 | Board provides filter controls for column, priority, label, blocked |
| AC-075 | 1468 | KB-034 | UC-008 | Cards are movable via keyboard shortcuts |
| AC-076 | 1488 | KB-034 | UC-008 | Alt+Up/Down reorders cards within column |
| AC-077 | 1506 | KB-035 | UC-001 | Blocked cards use icon alongside color indicator |
| AC-078 | 1523 | KB-035 | UC-001 | Labels use icon prefix alongside color |
| AC-079 | 1540 | KB-035 | UC-001 | WIP exceeded indicator uses icon alongside color |

Every AC includes the correct KB-xxx reference in its heading and maps to the appropriate use case. The Given/When/Then format is used consistently. Cross-references to schema entities and API contracts are included where applicable.

---

## 10. Traceability matrix in acceptance-criteria.md includes KB-028 through KB-035

**Status:** PASS

The traceability matrix at the end of acceptance-criteria.md (lines 1556-1594) includes all new requirements:

```
| KB-028 | AC-068 |
| KB-029 | AC-069 |
| KB-030 | AC-070 |
| KB-031 | AC-071 |
| KB-032 | AC-072 |
| KB-033 | AC-073, AC-074 |
| KB-034 | AC-075, AC-076 |
| KB-035 | AC-077, AC-078, AC-079 |
```

All 8 new requirements are mapped to their corresponding acceptance criteria. The coverage is correct:
- KB-033 maps to 2 ACs (search + filter controls) -- correct
- KB-034 maps to 2 ACs (move between columns + reorder within column) -- correct
- KB-035 maps to 3 ACs (blocked icon, label icon, WIP icon) -- correct

The full matrix now covers KB-001 through KB-035 (35 requirements) mapped to AC-001 through AC-079.

---

## 11. nfr.md security table updated with credential mgmt, transport security, path traversal, Slack webhook

**Status:** PASS

The nfr.md security table (lines 42-51) contains 8 rows:

| # | Requirement | Present | SEC tag |
|---|-------------|---------|---------|
| 1 | CMS Authentication | Yes (line 44) | (implicit SEC-B-001) |
| 2 | CMS Transport | Yes (line 45) | SEC-B-002 |
| 3 | File I/O safety | Yes (line 46) | -- |
| 4 | Input validation | Yes (line 47) | -- |
| 5 | Path traversal prevention | Yes (line 48) | SEC-B-003 |
| 6 | Error handling | Yes (line 49) | -- |
| 7 | Card ID generation | Yes (line 50) | -- |
| 8 | Slack webhook auth | Yes (line 51) | SEC-B-004 |

All four security blocker items from the review are present:
- Credential management (bcrypt, env vars, fail-closed) -- row 1
- Transport security (LAN-only accepted risk, CORS) -- row 2
- Path traversal prevention (allowlist + containment) -- row 5
- Slack webhook auth (HMAC-SHA256, 5-min window) -- row 8

Each row includes Implementation details and Verification criteria.

---

## 12. nfr.md accessibility table updated with non-color indicators and keyboard movement details

**Status:** PASS

The nfr.md accessibility table (lines 118-125) contains 6 rows:

| # | Requirement | Present | Details |
|---|-------------|---------|---------|
| 1 | Keyboard navigation | Yes (line 120) | "Alt+Left/Right moves card between columns; Alt+Up/Down reorders within column" |
| 2 | Screen reader support | Yes (line 121) | ARIA labels, ARIA live region for move announcements |
| 3 | Color contrast | Yes (line 122) | WCAG AA 4.5:1 minimum |
| 4 | Focus indicators | Yes (line 123) | Visible focus ring on all interactive elements |
| 5 | Non-color indicators | Yes (line 124) | "Blocked state, labels, WIP exceeded, and priority all use icon + color, never color alone" with KB-035 and WCAG 1.4.1 references |
| 6 | Drag-and-drop alternative | Yes (line 125) | Keyboard-based card movement via Alt+Arrow (KB-034), screen reader announces moves |

Both review blocker items are addressed:
- Non-color indicators (row 5): explicitly lists blocked state, labels, WIP exceeded, and priority. References KB-035 and WCAG 1.4.1.
- Keyboard movement details (rows 1 and 6): explicitly lists Alt+Left/Right for column moves and Alt+Up/Down for reordering. References KB-034.

---

## Previously Resolved Items (Carried Forward -- All PASS)

All 12 items from the initial consistency check remain resolved:

| # | Issue | Status |
|---|-------|--------|
| 1 | CardSource enum uses `agentdispatch` everywhere | PASS |
| 2 | BoardSettings field name `autoArchiveDays` everywhere | PASS |
| 3 | BoardSettings has `defaultPriority` in api-contracts.md | PASS |
| 4 | `specArtifact` in schemas.md known adapter set | PASS |
| 5 | WebSocket max backoff is 10s/10000ms in state-machines.md | PASS |
| 6 | Blocker question max length is 500 in both files | PASS |
| 7 | Board interface has `description` in api-contracts.md | PASS |
| 8 | BoardSettings has `idFormat` in schemas.md | PASS |
| 9 | ProjectConfig naming aligned between schemas.md and api-contracts.md | PASS |
| 10 | Glossary Blocker definition references `author`/`created` | PASS |
| 11 | AC-012 references file I/O removeBlocker | PASS |
| 12 | AC blocker format uses Blocker[] objects | PASS |

---

## Standing Warnings

| # | Severity | File | Description |
|---|----------|------|-------------|
| N-001 | INFO | api-contracts.md:742 | CLI `kanban show` output example displays `Source: agent` (display string) instead of `Source: agentdispatch` -- cosmetic only |
| W-001 | WARN | open-questions.md | Open question deadlines are relative ("Phase N") not absolute calendar dates |
| W-002 | WARN (expected) | -- | Wireframes not yet generated (skipped per instructions) |

---

## Conclusion

All 15 review blockers have been verified as fixed with full cross-artifact consistency:

- **3 consistency blockers (CON-B-001 through CON-B-003):** Note.type field present in both schemas.md and api-contracts.md; GET /ops endpoint defined and referenced by AC-032/AC-033; note heading format uses em dash + type tag consistently across all artifacts.

- **4 security blockers (SEC-B-001 through SEC-B-004):** CMS credential management (section 8.1), transport security (section 8.2), path traversal prevention (section 8.3), and Slack webhook verification (section 8.4) all defined in api-contracts.md with matching entries in nfr.md security table and schemas.md validation rules.

- **8 UX blockers:** Requirements KB-028 through KB-035 defined in requirements.md; acceptance criteria AC-068 through AC-079 defined with correct KB cross-references; traceability matrix updated; nfr.md accessibility table includes non-color indicators and keyboard movement details.

No new inconsistencies were found. The spec is internally consistent across all 7 artifacts (schemas.md, api-contracts.md, state-machines.md, requirements.md, acceptance-criteria.md, nfr.md, glossary.md) and is ready for wireframe generation and implementation.
