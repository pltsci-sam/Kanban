import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  initializeBoard,
  createCard,
  moveCard,
  archiveCard,
  readBoard,
  readCard,
} from '../../index.js';

let repoRoot: string;
let boardDir: string;

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'kanban-archive-'));
  boardDir = await initializeBoard(repoRoot);
  return async () => rm(repoRoot, { recursive: true });
});

describe('Auto-archive', () => {
  it('archives a card from Done column', async () => {
    const card = await createCard(boardDir, {
      title: 'Completed task',
      source: 'manual',
    });
    await moveCard(boardDir, card.id, 'Done');

    // Archive it
    await archiveCard(boardDir, card.id);

    // Card should be gone from board
    const { board, cards } = await readBoard(boardDir);
    expect(cards.find(c => c.id === card.id)).toBeUndefined();
    expect(board.cardOrder['Done']).not.toContain(card.id);

    // Card file should be in archive/
    const archiveFiles = await readdir(join(boardDir, 'archive'));
    expect(archiveFiles).toContain(`${card.id}.md`);

    // Archive file should be readable
    const content = await readFile(join(boardDir, 'archive', `${card.id}.md`), 'utf8');
    expect(content).toContain('Completed task');
  });

  it('archived card is no longer readable via readCard', async () => {
    const card = await createCard(boardDir, {
      title: 'To be archived',
      source: 'manual',
    });
    await moveCard(boardDir, card.id, 'Done');
    await archiveCard(boardDir, card.id);

    const result = await readCard(boardDir, card.id);
    expect(result).toBeNull();
  });

  it('archiving removes card from all column orders', async () => {
    const card = await createCard(boardDir, {
      title: 'Archive test',
      source: 'manual',
    });

    // Move through a few columns then archive
    await moveCard(boardDir, card.id, 'Building');
    await moveCard(boardDir, card.id, 'Done');
    await archiveCard(boardDir, card.id);

    const { board } = await readBoard(boardDir);
    for (const col of Object.keys(board.cardOrder)) {
      expect(board.cardOrder[col]).not.toContain(card.id);
    }
  });

  it('can archive multiple cards independently', async () => {
    const c1 = await createCard(boardDir, { title: 'Done A', source: 'manual' });
    const c2 = await createCard(boardDir, { title: 'Done B', source: 'manual' });
    const c3 = await createCard(boardDir, { title: 'Still active', source: 'manual' });

    await moveCard(boardDir, c1.id, 'Done');
    await moveCard(boardDir, c2.id, 'Done');

    await archiveCard(boardDir, c1.id);
    await archiveCard(boardDir, c2.id);

    const { cards } = await readBoard(boardDir);
    const ids = cards.map(c => c.id);
    expect(ids).not.toContain(c1.id);
    expect(ids).not.toContain(c2.id);
    expect(ids).toContain(c3.id);

    const archiveFiles = await readdir(join(boardDir, 'archive'));
    expect(archiveFiles).toContain(`${c1.id}.md`);
    expect(archiveFiles).toContain(`${c2.id}.md`);
  });
});
