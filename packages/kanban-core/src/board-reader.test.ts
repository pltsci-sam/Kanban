import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readBoard, readCard, BoardNotFoundError } from './board-reader.js';

const BOARD_YAML = `
name: Test
version: 1
columns:
  - name: Backlog
  - name: Done
    done: true
labels: []
cardOrder:
  Backlog: [a1b2c3]
  Done: []
settings:
  autoArchiveDays: 30
  defaultPriority: medium
  defaultColumn: Backlog
  idFormat: alphanumeric6
`;

const CARD_MD = `---
id: a1b2c3
title: Test Card
column: Backlog
priority: medium
labels: []
created: "2026-01-01T00:00:00Z"
updated: "2026-01-01T00:00:00Z"
source: manual
blockers: []
---

Test description.
`;

let boardDir: string;

beforeEach(async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'kanban-test-'));
  boardDir = join(tmp, '.kanban');
  await mkdir(join(boardDir, 'cards'), { recursive: true });
  await writeFile(join(boardDir, 'board.yaml'), BOARD_YAML);
  await writeFile(join(boardDir, 'cards', 'a1b2c3.md'), CARD_MD);
  return async () => rm(tmp, { recursive: true });
});

describe('readBoard', () => {
  it('reads board and cards', async () => {
    const state = await readBoard(boardDir);
    expect(state.board.name).toBe('Test');
    expect(state.cards).toHaveLength(1);
    expect(state.cards[0].id).toBe('a1b2c3');
    expect(state.errors).toHaveLength(0);
  });

  it('throws BoardNotFoundError when board.yaml missing', async () => {
    await expect(readBoard('/nonexistent/.kanban')).rejects.toThrow(
      BoardNotFoundError
    );
  });

  it('collects malformed cards in errors', async () => {
    await writeFile(join(boardDir, 'cards', 'badone.md'), 'not valid frontmatter');
    const state = await readBoard(boardDir);
    expect(state.cards).toHaveLength(1);
    expect(state.errors).toHaveLength(1);
    expect(state.errors[0].cardId).toBe('badone');
  });
});

describe('readCard', () => {
  it('reads existing card', async () => {
    const card = await readCard(boardDir, 'a1b2c3');
    expect(card).not.toBeNull();
    expect(card!.title).toBe('Test Card');
  });

  it('returns null for non-existent card', async () => {
    const card = await readCard(boardDir, 'zzzzzz');
    expect(card).toBeNull();
  });
});
