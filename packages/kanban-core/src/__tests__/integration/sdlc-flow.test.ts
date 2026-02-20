import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  initializeBoard,
  createCard,
  moveCard,
  appendNote,
  readBoard,
  readCard,
} from '../../index.js';
import type { CardCreateInput } from '../../index.js';

const SDLC_COLUMNS = [
  'Backlog',
  'Spec Creation',
  'Spec Review',
  'Building',
  'Testing',
  'Human Review',
  'Done',
];

let repoRoot: string;
let boardDir: string;

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'kanban-sdlc-'));
  boardDir = await initializeBoard(repoRoot);
  return async () => rm(repoRoot, { recursive: true });
});

describe('Full SDLC flow', () => {
  it('creates a card and moves it through all 7 columns with notes', async () => {
    const input: CardCreateInput = {
      title: 'Implement user auth',
      description: 'Add OAuth2 login flow',
      priority: 'high',
      source: 'manual',
      labels: ['backend', 'security'],
    };

    const card = await createCard(boardDir, input);
    expect(card.column).toBe('Backlog');
    expect(card.id).toMatch(/^[a-z0-9]{6}$/);

    // Move through each subsequent column, adding a phase note
    for (let i = 1; i < SDLC_COLUMNS.length; i++) {
      const col = SDLC_COLUMNS[i];
      const moved = await moveCard(boardDir, card.id, col);
      expect(moved.column).toBe(col);

      await appendNote(boardDir, card.id, {
        author: 'test-agent',
        content: `Entered ${col}`,
        type: 'milestone',
      });
    }

    // Verify final state
    const final = await readCard(boardDir, card.id);
    expect(final).not.toBeNull();
    expect(final!.column).toBe('Done');
    expect(final!.notes).toHaveLength(SDLC_COLUMNS.length - 1);
    expect(final!.notes[0].content).toBe('Entered Spec Creation');
    expect(final!.notes[final!.notes.length - 1].content).toBe('Entered Done');

    // Verify board state
    const { board } = await readBoard(boardDir);
    expect(board.cardOrder['Done']).toContain(card.id);
    expect(board.cardOrder['Backlog']).not.toContain(card.id);
  });

  it('preserves card order when multiple cards are in the same column', async () => {
    const card1 = await createCard(boardDir, { title: 'Card A', source: 'manual' });
    const card2 = await createCard(boardDir, { title: 'Card B', source: 'manual' });
    const card3 = await createCard(boardDir, { title: 'Card C', source: 'manual' });

    const { board } = await readBoard(boardDir);
    const backlog = board.cardOrder['Backlog'];
    expect(backlog).toEqual([card1.id, card2.id, card3.id]);
  });

  it('supports positional insert when moving cards', async () => {
    const card1 = await createCard(boardDir, { title: 'First', source: 'manual' });
    const card2 = await createCard(boardDir, { title: 'Second', source: 'manual' });
    await moveCard(boardDir, card1.id, 'Building');
    await moveCard(boardDir, card2.id, 'Building');

    // Move card2 to position 0 (before card1)
    await moveCard(boardDir, card2.id, 'Building', 0);

    const { board } = await readBoard(boardDir);
    expect(board.cardOrder['Building']).toEqual([card2.id, card1.id]);
  });
});
