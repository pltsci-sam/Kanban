## Security Review

**Reviewed By**: Security Reviewer Agent
**Date**: 2026-02-20
**Spec Version**: v0.1.0 (Draft — 2026-02-20, post-refinement)
**Overall Risk Assessment**: Medium

---

### Summary

This is a re-review following spec refinement that addressed four previously identified security blockers. All four blockers (SEC-B-001 through SEC-B-004) have been adequately resolved: credential management is now specified with bcrypt hashing and env var storage, the plaintext transport risk is explicitly documented as an accepted LAN-only trade-off, path traversal prevention is specified with character allowlists and containment checks, and Slack webhook signature verification is fully specified with HMAC-SHA256 and replay protection.

No new blockers were identified. However, the previous review's ten warnings (SEC-W-001 through SEC-W-010) and six suggestions (SEC-S-001 through SEC-S-006) remain unaddressed in the spec. These issues carry forward as-is. Additionally, this re-review identified four new issues: a subtle bypass in the path containment check (`startsWith` without path separator), a mismatch between the wireframe's HTML login form and the spec's Basic Auth mechanism, a missing maximum note content size constraint (raised previously as SEC-S-003 but still unresolved), and the absence of any specification for how `SLACK_WEBHOOK_URL` and `.env` gitignore guidance are handled (SEC-W-005 was partially closed but not fully resolved).

The system's threat model remains appropriate for a single-operator LAN tool. The blockers have been closed in a technically sound manner. The remaining warnings are real risks but do not individually block implementation — they should be tracked and addressed during implementation.

---

### Blocker Fix Verification

#### SEC-B-001: Credential Management — RESOLVED

**Location verified**: `api-contracts.md` section 8.1

The fix is adequate and well-specified. The spec now defines:
- `KANBAN_CMS_PASSWORD` environment variable (required, fail-closed on absence)
- `KANBAN_CMS_USERNAME` environment variable (optional, default `ops`)
- Server-side bcrypt hashing at startup with cost factor 12
- Plaintext password discarded from memory after hashing
- Constant-time comparison for both username and password at request time
- Credential rotation via env var update + process restart

One minor residual gap: the spec does not specify a minimum password length for `KANBAN_CMS_PASSWORD`. A one-character password would be accepted and bcrypt-hashed but would be trivially brute-forceable (addressed as SEC-W-003 below). Otherwise the fix is complete.

**Verdict: RESOLVED**

---

#### SEC-B-002: Transport Security — RESOLVED (Accepted Risk)

**Location verified**: `api-contracts.md` section 8.2, `nfr.md` Security table row 2

The fix documents the plaintext HTTP/WS transport as an explicitly accepted risk for the LAN-only deployment. The threat model assessment is reasonable:
- Network scope is documented as private LAN 192.168.68.0/24
- The risk of LAN sniffing is acknowledged
- The CORS restriction to LAN IP range is documented
- A migration path to TLS is described for future hardening

The acceptance is appropriate for the stated deployment context. The documentation makes the trade-off visible to implementers.

**Verdict: RESOLVED (Accepted Risk, Documented)**

---

#### SEC-B-003: Path Traversal Prevention — RESOLVED WITH CAVEAT

**Location verified**: `api-contracts.md` section 8.3, `schemas.md` Card validation rules

The fix adds character allowlists and containment checks. The implementation is mostly correct but contains a subtle bypass in the `validateSpecRef` function:

```typescript
const resolved = path.resolve(repoRoot, specRef);
return resolved.startsWith(path.resolve(repoRoot));
```

If `repoRoot` is `/home/sam/src/repo`, then `path.resolve(repoRoot)` is `/home/sam/src/repo`. A malicious `specRef` that resolves to `/home/sam/src/repo2/evil` would pass this check because `/home/sam/src/repo2/evil`.startsWith(`/home/sam/src/repo`) is `true`. The standard fix is to append a path separator: `resolved.startsWith(path.resolve(repoRoot) + path.sep)` or `resolved.startsWith(path.resolve(repoRoot) + '/')`. This is a real bypass in the code as written.

The `ralphFeature` validation (`^[a-z0-9][a-z0-9\-_]*$`) is correct — it does not allow slashes or dots, so no path construction is possible.

The `ProjectConfig.path` validation correctly checks `path.isAbsolute()` and absence of `..` components.

The enforcement points listed (BoardReader, ProjectsConfig parser, adapter `enrich()` methods) are appropriate.

**Verdict: RESOLVED WITH CAVEAT** — The `startsWith` bypass must be fixed before implementation. This is a new finding, cataloged as SEC-W-011 below.

---

#### SEC-B-004: Slack Webhook Signature Verification — RESOLVED

**Location verified**: `api-contracts.md` section 8.4, `nfr.md` Security table row 8

The fix is complete and technically correct:
- HMAC-SHA256 of `v0:{timestamp}:{request_body}` using `SLACK_SIGNING_SECRET`
- 5-minute timestamp window for replay protection
- Constant-time comparison with `X-Slack-Signature` header
- Fail-closed: reject all webhooks if `SLACK_SIGNING_SECRET` is not set
- Environment variables for `SLACK_SIGNING_SECRET` and `SLACK_BOT_TOKEN` are defined

This matches Slack's documented verification protocol exactly.

**Verdict: RESOLVED**

---

### Findings

#### Warnings (Should Fix, Can Proceed with Tracked Risk)

##### SEC-W-001: VS Code WebView XSS — Card Content Rendered Without Sanitization Spec

- **Checklist Item**: 5. Cross-Site Scripting (XSS)
- **Severity**: Warning
- **Location**: `api-contracts.md` section 1.2 (Card `description`, `notes[].content` — both "Markdown content"), `requirements.md` (KB-004, KB-005), `acceptance-criteria.md` AC-010 (blocker question displayed in card detail)
- **Issue**: Cards contain Markdown content written by both agents and humans. The VS Code extension renders this in a WebView. The spec specifies no Markdown sanitization rules, no Content-Security-Policy for the WebView, and no output encoding strategy. Agent-written content (blocker questions, milestone notes) and human-written content (unblock answers, descriptions) are both rendered. If a compromised agent writes a card with `<script>` tags or a Markdown URL using `javascript:` scheme, and the WebView renders it without sanitization, this is an XSS vector within VS Code.
- **Risk**: XSS in a VS Code WebView runs in the extension host process. Depending on VS Code's sandbox configuration, this could allow JavaScript execution with access to the extension's file system APIs — the same APIs used to write `.kanban/` files.
- **Recommendation**: (1) Specify that Markdown-to-HTML rendering MUST use a sanitizing Markdown renderer (e.g., `marked` + `DOMPurify`, or `remark-rehype` with `rehype-sanitize`). (2) Specify a VS Code WebView CSP: `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-{nonce}';">`. (3) Strip or reject Markdown URLs with `javascript:` scheme. (4) Add AC: "Card description and note content is sanitized before rendering in the WebView; `<script>` tags and `javascript:` URLs are stripped."
- **Acceptance Criteria Impact**: AC-010 (card detail view), AC-011 (unblock note display)
- **References**: OWASP Top 10 A03:2021 (Injection), CWE-79 (XSS), VS Code WebView Security docs

---

##### SEC-W-002: CMS Renders Agent Tool Inputs and Thinking Content Without XSS Mitigation

- **Checklist Item**: 5. Cross-Site Scripting (XSS)
- **Severity**: Warning
- **Location**: `api-contracts.md` section 5.3 (`AgentToolCallEvent.payload.toolInput` — max 200 chars), section 5.4 (`AgentThinkingEvent.payload.content` — max 500 chars), `requirements.md` (KB-017)
- **Issue**: The CMS browser dashboard renders `toolInput` and `content` from WebSocket/SSE events directly into the DOM. These strings contain arbitrary agent output. The spec defines no output encoding rules for these values. If rendered via `innerHTML` (common for streaming text animations), they are XSS vectors. The `nfr.md` specifies `Content-Security-Policy: default-src 'self'` but does not specify that dynamic content must use `textContent`.
- **Risk**: A compromised or buggy agent session could emit a `toolInput` payload containing `<script>` or `<img onerror=...>`. When rendered in the browser's DOM without encoding, this executes JavaScript in the browser context.
- **Recommendation**: (1) Specify that all dynamic content from WebSocket/SSE events MUST be inserted using `textContent` (not `innerHTML`) or HTML-encoded before insertion. (2) Add to nfr.md CMS Security Headers: `Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{nonce}'; connect-src ws://192.168.68.0/24 http://192.168.68.0/24`. (3) Add AC: "Agent tool call input and thinking content is text-encoded before DOM insertion; no `innerHTML` is used for event-sourced content."
- **Acceptance Criteria Impact**: AC-029 (CMS streams agent tool calls), AC-031 (CMS read-only)
- **References**: OWASP Top 10 A03:2021 (Injection), CWE-79 (XSS), CWE-116 (Improper Encoding)

---

##### SEC-W-003: No Rate Limiting on CMS Authentication Endpoint

- **Checklist Item**: 8. Rate Limiting and Abuse Prevention / 1. Authentication
- **Severity**: Warning
- **Location**: `nfr.md` Security section, `api-contracts.md` section 5.0 (`GET /ops`), `requirements.md` (KB-020, NFR-004)
- **Issue**: The spec specifies basic auth is required (KB-020) and that unauthenticated requests get 401 (NFR-004). No rate limiting is specified for failed authentication attempts. Basic auth is attempted on every HTTP request, creating an endpoint brute-forceable from the LAN without throttling. Additionally, no minimum password length is specified for `KANBAN_CMS_PASSWORD`, allowing operators to set trivially short passwords.
- **Risk**: Any device on the 192.168.68.0/24 LAN can brute-force the basic auth password. A typical HTTP server can handle thousands of requests per second. Without rate limiting or a minimum password length requirement, weak passwords could be cracked in minutes.
- **Recommendation**: (1) Specify rate limiting: maximum 10 failed auth attempts per IP per minute on `/ops`, `/dashboard/ws`, and SSE endpoints; respond with 429 and `Retry-After` header. (2) Specify minimum password length of 16 characters for `KANBAN_CMS_PASSWORD`. (3) Add AC: "After 10 failed auth attempts from the same IP within 60 seconds, subsequent requests receive HTTP 429 Too Many Requests with a `Retry-After` header."
- **Acceptance Criteria Impact**: AC-032 (CMS requires basic auth)
- **References**: OWASP Top 10 A07:2021 (Authentication Failures), CWE-307 (Improper Restriction of Excessive Authentication Attempts)

---

##### SEC-W-004: Card ID Generation Algorithm Underspecified — `Math.random()` Risk

- **Checklist Item**: 9. Cryptography
- **Severity**: Warning
- **Location**: `api-contracts.md` Appendix B (Card ID Generation), `schemas.md` (ID Generation section), `api-contracts.md` section 4.4 (blocker ID generation)
- **Issue**: `schemas.md` states "Generation method: Cryptographically random selection from the character set (not sequential)" but does not specify which API to use. `api-contracts.md` Appendix B defines the `CHARSET` constant but also specifies no API. The blocker ID generation description in section 4.4 ("Generate blocker ID: blk-{4 random alphanumeric chars}") makes no cryptographic mention at all. Without an explicit API mandate, implementers may use `Math.random()`.
- **Risk**: Non-cryptographic PRNG produces predictable IDs. An adversary with any knowledge of the system (e.g., the time a card was created) could enumerate IDs and read card files. For blocker IDs, predictability could enable crafting of valid blocker resolution payloads.
- **Recommendation**: (1) Add to Appendix B: "MUST use `crypto.randomBytes()` (Node.js) or `crypto.getRandomValues()` (browser Web Crypto API) — explicitly NOT `Math.random()`." (2) Apply the same requirement to blocker ID generation in section 4.4. (3) Add AC: "Card IDs and blocker IDs are generated using a cryptographically secure random number generator; `Math.random()` is explicitly prohibited."
- **Acceptance Criteria Impact**: AC-015 (Card IDs are 6-character lowercase alphanumeric)
- **References**: CWE-338 (Use of Cryptographically Weak PRNG), OWASP ASVS V2.9

---

##### SEC-W-005: Slack Integration Secrets Partially Specified — No `.gitignore` or `SLACK_WEBHOOK_URL` Guidance

- **Checklist Item**: 11. Third-Party Integration Security / 9. Cryptography
- **Severity**: Warning
- **Location**: `api-contracts.md` section 8.4, `requirements.md` (KB-012)
- **Issue**: The previous blocker SEC-B-004 introduced `SLACK_SIGNING_SECRET` and `SLACK_BOT_TOKEN` as environment variables. However, the broader secret management guidance from SEC-W-005 remains unresolved: (a) the Slack outbound webhook URL (if used for posting notifications) is not mentioned as a secret, (b) no guidance exists about `.env` files being gitignored, (c) no acceptance criteria requires that no Slack credentials appear in committed source code.
- **Risk**: Slack bot tokens and signing secrets committed to git are exposed to anyone with repository access. If the monorepo is ever made public (D-006 references an upcoming AIFactory monorepo), this would be a significant credential leak.
- **Recommendation**: (1) Add a Secrets Management subsection to `nfr.md` Security section specifying: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, and outbound webhook URL (if used) in environment variables; none in committed files. (2) Specify that `.env` files are listed in `.gitignore`. (3) Add AC: "No Slack tokens, signing secrets, or webhook URLs appear in committed source code or configuration files."
- **Acceptance Criteria Impact**: AC-022 (agent blocks and notifies all channels), AC-055 (full blocker lifecycle)
- **References**: CWE-312 (Cleartext Storage of Sensitive Information), OWASP ASVS V2.10

---

##### SEC-W-006: YAML Parser Not Specified — Billion Laughs / Alias Expansion DoS Risk

- **Checklist Item**: 3. Input Validation
- **Severity**: Warning
- **Location**: `api-contracts.md` section 2.1 (BoardReader), `nfr.md` Security (Input validation row), `requirements.md` (EF-001.1, EF-001.2)
- **Issue**: The spec correctly specifies Zod schema validation for parsed YAML. However, YAML parsers are vulnerable to "Billion Laughs" entity expansion attacks using YAML aliases and anchors. A malformed `board.yaml` or card frontmatter using deeply nested anchors could consume unbounded memory during parsing. The spec does not specify which YAML library to use or that alias expansion should be limited.
- **Risk**: A crafted `board.yaml` or card file could crash the YAML parser, causing the VS Code extension or AgentDispatch heartbeat process to fail to load board data. In AgentDispatch's case, a carefully crafted card could crash the heartbeat service, interrupting all autonomous agent work.
- **Recommendation**: (1) Specify the YAML parsing library (e.g., `js-yaml`) and configuration: YAML parsing MUST be configured to limit alias expansion (e.g., `js-yaml` option `{ maxAliasCount: 100 }`). (2) Add a maximum file size check before parsing: reject `board.yaml` over 1MB and card files over 500KB without attempting to parse. (3) Add AC: "The extension rejects board.yaml or card files exceeding 1MB without attempting to parse them."
- **Acceptance Criteria Impact**: AC-007 (malformed board.yaml displays error), AC-008 (malformed card skipped), AC-052 (malformed card isolated)
- **References**: CWE-400 (Uncontrolled Resource Consumption), CVE-2013-1664 (Python Billion Laughs analogue)

---

##### SEC-W-007: No Audit Log for CMS Auth Events or Human Unblock Actions

- **Checklist Item**: 12. Compliance and Privacy
- **Severity**: Warning
- **Location**: `nfr.md` Observability section, `acceptance-criteria.md` AC-011, AC-012, AC-013
- **Issue**: The observability requirements specify logging for agent card writes (info level) and file watcher events (debug level). Security-relevant human actions are not explicitly logged: (a) CMS authentication events (success and failure), (b) human unblock actions (answer given, channel used), (c) human manual card creation or movement. Without auth event logs, brute-force or unauthorized access to the CMS cannot be detected. Without unblock audit logs, there is no authoritative record of who authorized agent resumption.
- **Risk**: If an agent takes a harmful action after being unblocked, there is no auditable record of who performed the unblock, when, and via which channel. If the CMS is accessed by an unauthorized party, there is no detection mechanism.
- **Recommendation**: (1) Add to `nfr.md` Observability: "CMS authentication events MUST be logged at INFO level with timestamp, source IP, and result (success/failure) — never logging the password." (2) "Human unblock actions MUST be logged at INFO level with card ID, blocker ID, resolution channel (vs-code/slack/vivian), and timestamp." (3) Add AC: "All CMS authentication attempts are logged with timestamp and outcome; the password is never logged." (4) Add AC: "Human unblock actions are logged with card ID, blocker ID, channel, and timestamp."
- **Acceptance Criteria Impact**: AC-011 (unblock action), AC-032 (CMS auth), AC-033 (CMS valid credentials)
- **References**: OWASP ASVS V7 (Logging and Monitoring), CWE-778 (Insufficient Logging)

---

##### SEC-W-008: Concurrent `board.yaml` Writes — TOCTOU Race Condition Unresolved

- **Checklist Item**: 10. Business Logic Security
- **Severity**: Warning
- **Location**: `api-contracts.md` section 4.5 (Concurrency Considerations), `open-questions.md` OQ-003, `acceptance-criteria.md` AC-051
- **Issue**: OQ-003 (concurrent write handling) remains open. The spec acknowledges the concurrent write problem and specifies "last-writer-wins" as the resolution strategy. The read-modify-write sequence for `board.yaml` is not atomic at the OS level. Two agents reading `board.yaml` simultaneously will both make their modifications, and one will silently lose its `cardOrder` update. The spec's claim that "concurrent moves to different columns are safe" is incorrect: if Agent A removes card `x` from Backlog and Agent B appends card `y` to Backlog simultaneously, one agent's change will be silently lost under last-writer-wins.
- **Risk**: Concurrent writes from multiple agents to `board.yaml` can corrupt `cardOrder` state, causing cards to appear in the wrong column or be listed in multiple columns. This could cause AgentDispatch to double-dispatch work (two agents on the same card) or miss unblocked cards entirely.
- **Recommendation**: (1) OQ-003 must be resolved before implementation. Recommended approach: write a lock file (`.kanban/.board.lock`) before any `board.yaml` read-modify-write cycle, with a configurable timeout (e.g., 5 seconds). (2) Alternatively, specify a single-writer model where only AgentDispatch modifies `board.yaml`. (3) Add AC: "Concurrent writes to `board.yaml` from two agents do not result in a state where a card ID appears in zero or two `cardOrder` lists."
- **Acceptance Criteria Impact**: AC-051 (concurrent agent writes to board.yaml)
- **References**: CWE-362 (Race Condition — TOCTOU)

---

##### SEC-W-009: WebSocket Upgrade Does Not Enforce `Origin` Header — Cross-Origin WebSocket Risk

- **Checklist Item**: 6. Cross-Site Request Forgery (CSRF)
- **Severity**: Warning
- **Location**: `api-contracts.md` section 5.1 (`/dashboard/ws`), `nfr.md` CORS Policy section, `state-machines.md` CMS Connection State
- **Issue**: The spec specifies CORS restricted to the LAN IP range for HTTP endpoints, but CORS does not apply to WebSocket connections — browsers do not enforce CORS for WebSocket upgrades. Any web page the operator visits could attempt to open a WebSocket to `ws://192.168.68.69:3001/dashboard/ws`. The browser will not include the Basic Auth header in this cross-origin WebSocket attempt, but if the WebSocket endpoint does not require auth (or checks only cookies), a cross-origin page could connect. The spec states "Basic auth header in upgrade request" but does not explicitly mandate that the server MUST reject upgrade requests lacking a valid `Authorization` header.
- **Risk**: A malicious web page visited by the operator could open a WebSocket to AgentDispatch and read the dashboard event stream (active agent data, blocker questions, card titles). While the CMS is read-only, leaked operational context is still a risk.
- **Recommendation**: (1) Add explicit requirement: "AgentDispatch MUST require a valid `Authorization` header on the WebSocket upgrade request (`GET /dashboard/ws`) and MUST reject connections without valid credentials with HTTP 401 before the WebSocket handshake completes." (2) Add `Origin` header validation on the upgrade: reject if Origin is not in the allowed LAN origin list. (3) Add AC: "WebSocket upgrade request without a valid `Authorization` header receives HTTP 401 and the handshake is aborted."
- **Acceptance Criteria Impact**: AC-028 (CMS establishes WebSocket), AC-032 (CMS requires basic auth)
- **References**: CWE-346 (Origin Validation Error), RFC 6455 Section 4.1 (WebSocket Client Authentication)

---

##### SEC-W-010: Agent Impersonation — No Identity Verification for File Writers

- **Checklist Item**: 2. Authorization
- **Severity**: Warning
- **Location**: `api-contracts.md` sections 4.2, 4.3, 4.4 (AgentDispatch file I/O), section 6 (Vivian file I/O), `schemas.md` (Note.author field — max 50 chars, free-form string)
- **Issue**: Cards record `assignee`, blocker `author`, and note `author` as free-form strings with no mechanism to verify the identity of the process writing the card. Any process with filesystem write access to `.kanban/` can claim any author identity. A buggy or malicious process could write a card claiming to be `specops-verifier`, falsely marking cards as having passed testing.
- **Risk**: False verification records could cause AgentDispatch to advance cards to Human Review without actual testing having occurred. A note written claiming to be `"human"` could falsely resolve a blocker without human involvement.
- **Recommendation**: (1) Document as an accepted trust boundary: "All file writers are trusted processes on the NUC; author fields are advisory, not authenticated." (2) Specify that git commit authorship (set via `git config user.email`) serves as the audit mechanism: agent commits use a distinct bot identity (e.g., `AgentDispatch Bot <agent@localhost>`). (3) Add AC: "Agent-initiated git commits use the AgentDispatch bot git identity, distinguishable from human commits in `git log`."
- **Acceptance Criteria Impact**: AC-016 (git commit as audit trail), AC-024 (agent card movement triggers git commit)
- **References**: CWE-290 (Authentication Bypass by Spoofing)

---

##### SEC-W-011: Path Containment Check Has `startsWith` Bypass (New Finding)

- **Checklist Item**: 3. Input Validation / 4. Injection (Filesystem)
- **Severity**: Warning
- **Location**: `api-contracts.md` section 8.3 (`validateSpecRef` function), `schemas.md` Card validation rules
- **Issue**: The `validateSpecRef` containment check uses:
  ```typescript
  const resolved = path.resolve(repoRoot, specRef);
  return resolved.startsWith(path.resolve(repoRoot));
  ```
  This has a known bypass: if `repoRoot` is `/home/sam/src/repo`, then a `specRef` that resolves to `/home/sam/src/repo2/evil` would pass the check because the string `/home/sam/src/repo2/evil` starts with the string `/home/sam/src/repo`. The path separator is not included in the prefix, allowing adjacent directory names to bypass the containment check.
- **Risk**: An attacker-controlled `specRef` could escape the intended `specs/` subdirectory and access sibling directories of the repo root. For example, if the repo root is `/home/sam/src/Kanban`, a `specRef` resolving to `/home/sam/src/Kanban2` would pass the check. This partially undermines the SEC-B-003 fix.
- **Recommendation**: Fix the containment check to append a trailing path separator to the base directory before comparison:
  ```typescript
  const base = path.resolve(repoRoot) + path.sep;
  return resolved.startsWith(base) || resolved === path.resolve(repoRoot);
  ```
  Additionally, the `specRef` allowlist regex `^[a-z0-9][a-z0-9\-\/]*$` allows forward slashes, so the `..` check and containment check must both be correct. Update the spec to use the corrected form.
- **Acceptance Criteria Impact**: AC-002 (cards display enriched data from adapter sources — adapter path must be safe)
- **References**: CWE-22 (Path Traversal), CWE-20 (Improper Input Validation)

---

##### SEC-W-012: CMS Login Form vs. HTTP Basic Auth Mechanism Mismatch (New Finding)

- **Checklist Item**: 1. Authentication
- **Severity**: Warning
- **Location**: `wireframes.pscanvas/screens/cms-login.json` (login form with username/password fields), `api-contracts.md` section 5.0 (`GET /ops` — "Auth: Basic auth (Authorization header)"), `api-contracts.md` section 8.1 (credential management)
- **Issue**: The wireframe (`cms-login.json`) shows a custom HTML login form with separate username and password `TextInput` fields and a submit button that calls `submitBasicAuth(username, password)`. The spec's API contract specifies HTTP Basic Auth via the `Authorization` header. These are different mechanisms: native HTTP Basic Auth shows the browser's built-in credential dialog and does not involve an HTML form; a custom form requires JavaScript to construct the `Authorization: Basic base64(username:password)` header and send it on subsequent requests. The spec does not clarify which mechanism is intended or specify how credentials are stored client-side after the initial form submission.
- **Risk**: If the custom form uses JavaScript to base64-encode and store credentials for subsequent requests (e.g., in `localStorage` or `sessionStorage`), credentials are accessible to any JavaScript running on the page — a risk if SEC-W-002 (XSS via agent content) is also exploited. Additionally, if credentials are stored in `localStorage`, they persist across browser sessions and are accessible to other pages on the same origin. The browser's native Basic Auth prompt avoids both of these risks.
- **Recommendation**: (1) Clarify in `api-contracts.md` section 5.0 whether native HTTP Basic Auth (browser dialog) or a custom form is intended. (2) If a custom form is used, specify: credentials are NOT stored in `localStorage` or `sessionStorage`; credentials are kept only in an in-memory JavaScript variable for the page session; each request (including WebSocket upgrade) includes the `Authorization` header constructed from the in-memory credential. (3) Add an explicit AC: "After submitting the login form, credentials are not written to `localStorage`, `sessionStorage`, or any browser storage API."
- **Acceptance Criteria Impact**: AC-032 (CMS requires basic auth), AC-033 (CMS valid credentials grant access)
- **References**: OWASP Top 10 A07:2021 (Authentication Failures), CWE-312 (Cleartext Storage of Sensitive Information in client storage)

---

#### Suggestions (Nice to Have, Best Practice)

##### SEC-S-001: Add `script-src` Nonce to CMS Content-Security-Policy

- **Checklist Item**: 5. XSS
- **Severity**: Suggestion
- **Description**: The `nfr.md` specifies `Content-Security-Policy: default-src 'self'` for the CMS. This does not include a `script-src` with nonces. For a streaming dashboard that renders dynamic content from WebSocket events, a nonce-based CSP is the defense-in-depth layer that prevents injected `<script>` tags from executing even if `textContent` is accidentally used as `innerHTML`.
- **Benefit**: If SEC-W-002 is missed in implementation, a nonce-based CSP prevents injected scripts from executing. The header would be: `Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{nonce}'; connect-src ws://192.168.68.0/24`.

---

##### SEC-S-002: Git Commit Signatures for Agent-Initiated Changes

- **Checklist Item**: 10. Business Logic Security / 12. Compliance
- **Severity**: Suggestion
- **Description**: Agent-initiated kanban file changes are committed to git (KB-009). The spec specifies commit message format but not git author identity. Without configured git author settings, commits will use whatever is in `~/.gitconfig`. Consider configuring AgentDispatch to commit with a specific, distinct git identity (e.g., `AgentDispatch Bot <agent@localhost>`) separate from the human operator's git identity.
- **Benefit**: Provides clear auditability in `git log`: agent-initiated commits (author: AgentDispatch Bot) are distinguishable from human-initiated commits (author: Sam). Supports SEC-W-010 by giving git history as a partial identity audit trail.

---

##### SEC-S-003: Specify Maximum Card Note Content Size

- **Checklist Item**: 3. Input Validation
- **Severity**: Suggestion
- **Description**: The `Note.content` field is defined in `schemas.md` as "Markdown content — NOT NULL" with no maximum size. The `NoteInput.content` in `api-contracts.md` section 2.2 also has no maximum. An agent generating an excessively large milestone note (e.g., including full file contents) could create card files that are hundreds of megabytes, stressing the file watcher and VS Code rendering pipeline.
- **Benefit**: Prevents accidental or adversarial oversized note content from degrading board performance. Suggested limit: 10,000 characters per note, consistent with the blocker `question` max of 500 chars and milestone `summary` max of 1,000 chars.

---

##### SEC-S-004: Validate `cmsUrl` Field in ProjectConfig as a Safe URL

- **Checklist Item**: 3. Input Validation / 5. XSS
- **Severity**: Suggestion
- **Description**: The `ProjectConfig.cmsUrl` field (`api-contracts.md` section 1.5, `schemas.md` ProjectConfig) is a URL displayed in the cross-repo dashboard, presumably as a clickable link. The spec defines no validation for this field beyond being a nullable string. A `javascript:` URL in `cmsUrl` would create an XSS vector in the VS Code WebView if rendered as an `<a href>`.
- **Benefit**: Prevents an adversarial `projects.yaml` entry from injecting a `javascript:` URL that executes when the operator clicks the CMS link. Validate that `cmsUrl` matches `^https?://` before rendering as a link, and render it as plain text if it fails validation.

---

##### SEC-S-005: Define Behavior When `KANBAN_CMS_PASSWORD` Is Set to an Empty String

- **Checklist Item**: 9. Cryptography / 1. Authentication
- **Severity**: Suggestion
- **Description**: The fail-closed behavior is specified for a missing env var (`KANBAN_CMS_PASSWORD` not set). However, the spec does not define behavior if the env var is set to an empty string (`KANBAN_CMS_PASSWORD=""`). An empty password bcrypt-hashes successfully and would be accepted by `bcrypt.compare()`, effectively allowing authentication with no password.
- **Benefit**: Prevents a misconfiguration where an operator sets an empty password and believes the CMS is protected. The server should treat an empty `KANBAN_CMS_PASSWORD` the same as a missing one: fail closed with an error message.

---

##### SEC-S-006: Specify `.kanban/` Directory Permissions

- **Checklist Item**: 2. Authorization
- **Severity**: Suggestion
- **Description**: The spec does not specify filesystem permissions for `.kanban/` directories. If `chmod 777` is used as a developer shortcut, any local process can read and modify kanban files. Given that multiple agent processes (AgentDispatch, Vivian, VS Code extension) access these files, specifying `700` permissions for the `.kanban/` directory would restrict access to the owner process.
- **Benefit**: Limits filesystem-level access to kanban data to the intended processes running as the same user. Adds a layer of OS-level access control at no implementation cost.

---

### Checklist Results

| # | Check | Status | Findings |
|---|-------|--------|----------|
| 1 | Authentication | PARTIAL | SEC-W-003, SEC-W-012 |
| 2 | Authorization | PARTIAL | SEC-W-010, SEC-S-006 |
| 3 | Input Validation | PARTIAL | SEC-W-006, SEC-W-011, SEC-S-003, SEC-S-004 |
| 4 | Injection | PARTIAL | SEC-W-011 |
| 5 | XSS | PARTIAL | SEC-W-001, SEC-W-002, SEC-S-001, SEC-S-004 |
| 6 | CSRF | PARTIAL | SEC-W-009 |
| 7 | Data Exposure | PASS | Error responses exclude stack traces and internal paths per nfr.md; no PII beyond operational card content; CMS is read-only. |
| 8 | Rate Limiting | FAIL | SEC-W-003 (no rate limiting specified on any endpoint) |
| 9 | Cryptography | PARTIAL | SEC-W-004, SEC-S-005 |
| 10 | Business Logic | PARTIAL | SEC-W-008, SEC-W-010, SEC-S-002 |
| 11 | Third-Party | PARTIAL | SEC-W-005 |
| 12 | Compliance | PARTIAL | SEC-W-007 |

---

### Blocker Summary

All four previous blockers (SEC-B-001 through SEC-B-004) are resolved. No new blockers were identified in this re-review.

The `startsWith` path traversal bypass (SEC-W-011) is technically a gap in the SEC-B-003 fix but is rated as a Warning rather than a new Blocker because:
- The character allowlist in `validateSpecRef` (`^[a-z0-9][a-z0-9\-\/]*$`) already prohibits `..`, preventing traditional path traversal
- The bypass requires a sibling directory with a name that is a prefix of the repo directory name (e.g., `repo` and `repo2` at the same parent) — an unlikely accidental configuration
- The fix is a one-line change to add `path.sep` to the containment check

The login form vs. Basic Auth mechanism mismatch (SEC-W-012) is rated as a Warning because the wireframe's `submitBasicAuth(username, password)` call suggests the developer intends to construct the Basic Auth header in JavaScript, which is functionally correct if implemented carefully, but the spec needs to clarify client-side credential storage rules.

---

### Sign-Off

- [x] All previous Blockers (SEC-B-001 through SEC-B-004) verified as addressed
- [ ] New findings SEC-W-011 and SEC-W-012 tracked with owners
- [ ] Warnings SEC-W-001 through SEC-W-010 tracked with owners
- [ ] Acceptance criteria updated for SEC-W-011 (path containment fix) and SEC-W-012 (credential storage)
