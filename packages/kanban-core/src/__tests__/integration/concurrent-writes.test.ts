import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  initializeBoard,
  createCard,
  readBoard,
  appendNote,
} from '../../index.js';

let repoRoot: string;
let boardDir: string;

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'kanban-concurrent-'));
  boardDir = await initializeBoard(repoRoot);
  return async () => rm(repoRoot, { recursive: true });
});

describe('Concurrent writes', () => {
  it('two agents creating different cards sequentially', async () => {
    // Card creation must be sequential — both read/write board.yaml
    const card1 = await createCard(boardDir, {
      title: 'Agent Alpha task',
      source: 'agentdispatch',
      assignee: 'agent-alpha',
    });
    const card2 = await createCard(boardDir, {
      title: 'Agent Beta task',
      source: 'agentdispatch',
      assignee: 'agent-beta',
    });

    expect(card1.id).not.toBe(card2.id);

    // Both cards should exist in the board
    const { board, cards } = await readBoard(boardDir);
    const ids = cards.map(c => c.id);
    expect(ids).toContain(card1.id);
    expect(ids).toContain(card2.id);

    // cardOrder should have both in Backlog
    const backlog = board.cardOrder['Backlog'];
    expect(backlog).toContain(card1.id);
    expect(backlog).toContain(card2.id);
  });

  it('concurrent note appends to different cards', async () => {
    const card1 = await createCard(boardDir, { title: 'Card X', source: 'manual' });
    const card2 = await createCard(boardDir, { title: 'Card Y', source: 'manual' });

    // Concurrent notes on different cards — no file contention
    await Promise.all([
      appendNote(boardDir, card1.id, {
        author: 'agent-1',
        content: 'Note on X',
        type: 'comment',
      }),
      appendNote(boardDir, card2.id, {
        author: 'agent-2',
        content: 'Note on Y',
        type: 'comment',
      }),
    ]);

    const { cards } = await readBoard(boardDir);
    const x = cards.find(c => c.id === card1.id)!;
    const y = cards.find(c => c.id === card2.id)!;
    expect(x.notes).toHaveLength(1);
    expect(x.notes[0].content).toBe('Note on X');
    expect(y.notes).toHaveLength(1);
    expect(y.notes[0].content).toBe('Note on Y');
  });

  it('sequential writes to the same card are consistent', async () => {
    const card = await createCard(boardDir, { title: 'Shared card', source: 'manual' });

    // Sequential notes — must all persist
    for (let i = 0; i < 5; i++) {
      await appendNote(boardDir, card.id, {
        author: `agent-${i}`,
        content: `Note ${i}`,
        type: 'comment',
      });
    }

    const { cards } = await readBoard(boardDir);
    const c = cards.find(c => c.id === card.id)!;
    expect(c.notes).toHaveLength(5);
    for (let i = 0; i < 5; i++) {
      expect(c.notes[i].content).toBe(`Note ${i}`);
    }
  });
});
