# kanban — Claude Code Kanban Skill

File-based kanban board management for the AIFactory SDLC pipeline.
Operates on `.kanban/` directories using `@kanban/core` library functions.

All commands are purely file I/O — no network dependencies.

## Commands

### `kanban init`

Initialize a new kanban board in the current working directory.

```
Usage: kanban init [--name <board-name>]

Options:
  --name <board-name>   Board display name (default: repo directory name)
```

**Implementation:** Call `initializeBoard(repoRoot)` from `@kanban/core`.
Print the 7 SDLC column names on success. Exit 1 if `.kanban/` already exists.

---

### `kanban add`

Create a new card on the board.

```
Usage: kanban add <title> [options]

Arguments:
  <title>               Card title (required)

Options:
  --col <column>        Target column (default: board.settings.defaultColumn)
  --priority <p>        critical | high | medium | low (default: medium)
  --label <l>           Label name (repeatable)
  --assignee <name>     Assignee identifier
  --due <YYYY-MM-DD>    Deadline date
  --desc <text>         Card description body
  --spec-ref <dir>      Reference to specs/ subdirectory
  --ralph-feature <key> Reference to .ralph/features.json key
```

**Implementation:** Call `createCard(boardDir, input)` from `@kanban/core` with `source: "manual"`.
Print card ID, title, column, priority, and labels on success.

---

### `kanban move`

Move a card to a different column.

```
Usage: kanban move <id> <column>

Arguments:
  <id>      Card ID (6-char alphanumeric)
  <column>  Target column name
```

**Implementation:** Call `moveCard(boardDir, cardId, targetColumn)` from `@kanban/core`.
Print old column -> new column on success.

---

### `kanban done`

Mark a card as done (shortcut for `kanban move <id> Done`).

```
Usage: kanban done <id>

Arguments:
  <id>   Card ID (6-char alphanumeric)
```

**Implementation:** Find the column with `done: true` in board.yaml, then call `moveCard()`.

---

### `kanban list`

List cards on the board with optional filters.

```
Usage: kanban list [options]

Options:
  --col <column>      Filter by column
  --blocked           Show only blocked cards
  --priority <p>      Filter by priority
  --label <l>         Filter by label (repeatable, OR logic)
  --assignee <name>   Filter by assignee
  --format <fmt>      table | json (default: table)
```

**Implementation:** Call `readBoard(boardDir)` from `@kanban/core`, apply filters, sort by column order then cardOrder position. Table format groups by column with card summaries. JSON format returns `{ cards: [...], total: N }`.

---

### `kanban show`

Display full card details including notes and enrichment data.

```
Usage: kanban show <id>

Arguments:
  <id>   Card ID (6-char alphanumeric)
```

**Implementation:** Call `readCard(boardDir, cardId)` from `@kanban/core`. Run `AdapterRegistry.enrichCards()` for enrichment (best-effort). Print full card details, blockers, description, and all notes.

---

### `kanban archive`

Archive old cards from the Done column.

```
Usage: kanban archive [options]

Options:
  --days <n>     Days since last update before archiving (default: board.settings.autoArchiveDays)
  --dry-run      Print what would be archived without making changes
```

**Implementation:** Read all cards in the Done column. Filter where `(now - card.updated) > N days` AND `card.pin !== true`. Call `archiveCard(boardDir, cardId)` for each. Skip pinned cards.

---

### `kanban validate`

Validate board integrity.

```
Usage: kanban validate
```

**Implementation:** Call `validateBoard(boardDir)` from `@kanban/core`. Print errors and warnings grouped by source. Exit 0 if no errors, exit 1 if errors found.

---

## Board Directory Resolution

All commands resolve the board directory by searching for `.kanban/board.yaml` starting from the current working directory and walking up to the repo root. If not found, print error and exit 1.

## Error Handling

All commands follow the same pattern:
- `BoardNotFoundError` → "No kanban board found. Run `kanban init` to create one."
- `CardNotFoundError` → "Card {id} not found."
- `ColumnNotFoundError` → "Column '{name}' not found in board.yaml."
- `BoardValidationError` → "Invalid board.yaml: {details}"
