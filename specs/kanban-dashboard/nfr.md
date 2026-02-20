# Kanban Dashboard — Non-Functional Requirements

**Spec:** kanban-dashboard
**Type:** fullstack
**Date:** 2026-02-20

---

## Performance

### File I/O Targets

| Operation | Metric | Target | Measurement |
|-----------|--------|--------|-------------|
| Read board.yaml | P95 latency | <50ms | Time to parse YAML + validate |
| Read all cards (<50) | P95 latency | <200ms | Time to read + parse all card files |
| Write card file | P95 latency | <20ms | Atomic write-then-rename |
| Update board.yaml | P95 latency | <30ms | Read-modify-write cycle |

### Screen Targets (VS Code Webview)

| Screen | Metric | Target | Measurement |
|--------|--------|--------|-------------|
| Board view | Time to Interactive | <1s | First render with all cards for <50 card board |
| Board view | Frame rate during drag | 30+ fps | Drag-and-drop animation smoothness |
| Card detail view | Open time | <200ms | Click to detail panel visible |
| Cross-repo dashboard | Load time | <2s | Read all projects + aggregate health |

### CMS Dashboard Targets

| Component | Metric | Target | Measurement |
|-----------|--------|--------|-------------|
| WebSocket connect | Time to first event | <1s | Page load to first dashboard event |
| Agent activity stream | Event rendering | <100ms | Event received to DOM update |
| Pipeline overview | Update latency | <500ms | Card move to pipeline count update |
| Reconnection | Recovery time | <10s | Connection loss to stream resume |

---

## Security

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| CMS Authentication | Basic HTTP auth via env vars (`KANBAN_CMS_USERNAME`, `KANBAN_CMS_PASSWORD`); bcrypt-hashed server-side; constant-time comparison | Request without credentials returns 401; missing env var prevents startup (fail-closed) |
| CMS Transport | Plaintext HTTP/WS on LAN — accepted risk (SEC-B-002) | CORS restricted to 192.168.68.0/24; no internet exposure |
| File I/O safety | Write-then-rename atomic pattern for all file writes | Crash during write does not corrupt existing file |
| Input validation | Zod schema validation on all parsed YAML/frontmatter | Malformed input returns parse error, not crash |
| Path traversal prevention | Character allowlist + containment check on `specRef`, `ralphFeature`, `ProjectConfig.path` (SEC-B-003) | Paths with `..` or outside repo root are rejected |
| Error handling | No stack traces or internal paths in CMS responses | Error responses contain only code + message |
| Card ID generation | Cryptographically random 6-char alphanumeric | IDs pass randomness tests, no sequential patterns |
| Slack webhook auth | HMAC-SHA256 signature verification via `SLACK_SIGNING_SECRET`; 5-min timestamp window (SEC-B-004) | Unsigned or expired webhooks rejected with 401 |

### CMS Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| Content-Security-Policy | default-src 'self' | Restrict content sources |

### CORS Policy

| Setting | Value |
|---------|-------|
| Allowed Origins | LAN IP range (192.168.68.0/24) |
| Credentials | true |
| Allowed Methods | GET (CMS is read-only) |
| Max Age | 3600 seconds |

---

## Scalability

| Metric | Current | Target | Growth Rate |
|--------|---------|--------|-------------|
| Cards per board | 0 | 50 | ~10 per month |
| Repos in projects.yaml | 0 | 10 | ~2 per quarter |
| Card files on disk | 0 | 500 (with archive) | ~50 per month |
| Agent sessions/day | 5-10 | 20 | ~2x per quarter |

### Scaling Strategy

| Component | Strategy | Trigger |
|-----------|----------|---------|
| Card storage | Archive old cards to archive/ directory | >50 active cards |
| Board.yaml | Keep cardOrder lists short via archiving | >100 entries in any column |
| CMS connections | Single WebSocket per browser tab | N/A (single user) |
| File watchers | Debounce to 300ms, ignore archive/ changes | High write frequency |

---

## Reliability

| Metric | Target |
|--------|--------|
| Board data integrity | No data loss — git is the backup layer |
| File write atomicity | Write-then-rename pattern prevents corruption |
| CMS reconnection | Auto-reconnect within 10s with exponential backoff |
| Adapter resilience | Missing/malformed adapter data → graceful degradation, not crash |
| Error rate | <0.1% of file operations result in errors |

---

## Observability

| Requirement | Implementation | Measurement |
|-------------|----------------|-------------|
| VS Code logging | Output channel "Kanban" for extension logs | Structured logs viewable in VS Code Output panel |
| CMS logging | structlog with JSON format | Log entries include timestamp, level, component |
| File watcher events | Log file change events at debug level | Traceable file change → render cycle |
| Adapter errors | Log adapter failures at warn level with source path | Failed adapter reads visible in logs |
| Agent card writes | Log card create/move/update at info level | Traceable agent actions in git log + extension log |

---

## Accessibility

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Keyboard navigation | All board operations accessible via keyboard (KB-034) | Tab/Enter/Arrow keys navigate board; Alt+Left/Right moves card between columns; Alt+Up/Down reorders within column |
| Screen reader support | Cards announce title, column, priority; moves announced | ARIA labels on card elements; ARIA live region for move announcements |
| Color contrast | WCAG AA (4.5:1 minimum) | Automated contrast check on all text |
| Focus indicators | Visible focus ring on all interactive elements | Focus visible during keyboard navigation |
| Non-color indicators | All state indicators use icon alongside color (KB-035, WCAG 1.4.1) | Blocked state, labels, WIP exceeded, and priority all use icon + color, never color alone |
| Drag-and-drop alternative | Keyboard-based card movement via Alt+Arrow (KB-034) | Cards movable without mouse; screen reader announces moves |
