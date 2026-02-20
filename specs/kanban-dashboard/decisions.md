# Kanban Dashboard — Decisions

## D-001: File Format — YAML + Markdown Hybrid

**Decision:** Board configuration in YAML (`board.yaml`), cards as Markdown with YAML frontmatter (`.md`).

**Rationale:** YAML supports comments and produces clean git diffs. Markdown is the lingua franca of developer tools and natural for both humans and AI. Multi-file structure (one file per card) minimizes merge conflicts. Proven pattern used by Kanbn, Hugo, Jekyll.

**Alternatives Considered:**
- Single JSON file (Portable Kanban pattern) — poor git diffs, no comments
- Single Markdown file (TODO.md pattern) — merge conflict prone at scale
- YAML-only (no markdown body) — loses rich description formatting

## D-002: Cards Are Thin — Enrichment via Adapters

**Decision:** Card frontmatter stores only core task data (title, column, priority, labels, dates, blockers). SDLC details (ralph progress, spec status, agent sessions) come from adapters reading `.ralph/` and `.specops/` at display time.

**Rationale:** Avoids duplicating state across systems. `.ralph/features.json` is the source of truth for build progress; `.specops/state.json` is the source of truth for spec status. Cards hold lightweight references (`specRef`, `ralphFeature`) for adapter lookups.

**Alternatives Considered:**
- Fat cards with duplicated SDLC data — sync nightmares, stale data
- Cards as only references (no frontmatter) — too thin, can't function standalone

## D-003: AgentDispatch Reads/Writes Files Directly

**Decision:** AgentDispatch interacts with `.kanban/` via direct file I/O (same pattern as `.specops/state.json`).

**Rationale:** AgentDispatch runs on the NUC with direct filesystem access to all repos. No API layer needed — file I/O is simpler, faster, and consistent with existing patterns. Atomic write-then-rename prevents corruption.

**Alternatives Considered:**
- REST API for kanban CRUD — adds unnecessary network layer for co-located processes
- Database (SQLite) — adds another persistence layer when git + files already work

## D-004: CMS Dashboard Is Read-Only

**Decision:** The CMS ops dashboard is a read-only view. No write actions. Human actions happen via Vivian (voice), Slack, VS Code board, or AgentDispatch dashboard.

**Rationale:** Keeps the CMS simple and safe — no risk of accidental data modification from the web. Aligns with the pattern of having dedicated action surfaces (VS Code for direct edits, Vivian for voice, Slack for async).

## D-005: SDLC-Aligned Default Columns

**Decision:** Default board columns map to SPECOPS SDLC phases: Backlog → Spec Creation → Spec Review → Building → Testing → Human Review → Done.

**Rationale:** The kanban board is fundamentally an SDLC pipeline view. Columns should match the phases that agents drive. Customizable for non-SDLC boards but defaults optimize for the primary use case.

## D-006: AIFactory Monorepo

**Decision:** All ecosystem projects will live in a monorepo at `~/src/AIFactory` before implementation begins. CMS is brought into the monorepo and modified for the ops dashboard.

**Rationale:** The projects are one ecosystem — shared types, cross-project adapters, and unified deployment benefit from co-location. Reduces context switching and simplifies dependency management.

**Status:** Pending — monorepo structure not yet defined (OQ-001).

## D-007: Multi-Channel Blocker Notification

**Decision:** When an agent blocks, notification goes to all available channels: Slack thread, card visual indicator on the board, and Vivian announcement (if in a meeting).

**Rationale:** Blocked tasks are the #1 bottleneck in the autonomous pipeline. Maximizing notification surface area minimizes resolution time.

## D-008: Auto-Archive with Pin Protection

**Decision:** Cards auto-archive after N days (default 30) in a Done column. Cards with `pin: true` are exempt.

**Rationale:** Keeps the active board clean without losing history. Pinning allows important reference cards to stay visible. Archive directory maintains git history.
