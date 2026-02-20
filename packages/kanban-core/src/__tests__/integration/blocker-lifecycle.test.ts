import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  initializeBoard,
  createCard,
  updateCard,
  readCard,
  appendNote,
  generateBlockerId,
} from '../../index.js';

let repoRoot: string;
let boardDir: string;

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'kanban-blocker-'));
  boardDir = await initializeBoard(repoRoot);
  return async () => rm(repoRoot, { recursive: true });
});

describe('Blocker lifecycle', () => {
  it('block → notify → unblock → resume', async () => {
    const card = await createCard(boardDir, {
      title: 'Deploy API v2',
      source: 'agentdispatch',
    });
    expect(card.blockers).toHaveLength(0);

    // Block the card
    const blockerId = generateBlockerId();
    expect(blockerId).toMatch(/^blk-[a-z0-9]{4}$/);

    const blocker = {
      id: blockerId,
      question: 'Need API key from infra team',
      author: 'agent-alpha',
      created: new Date().toISOString(),
    };

    const blocked = await updateCard(boardDir, card.id, {
      blockers: [blocker],
    });
    expect(blocked.blockers).toHaveLength(1);
    expect(blocked.blockers[0].question).toBe('Need API key from infra team');

    // Add a blocker note
    await appendNote(boardDir, card.id, {
      author: 'agent-alpha',
      content: 'Blocked: waiting for infra team API key',
      type: 'blocker',
    });

    // Unblock
    const unblocked = await updateCard(boardDir, card.id, {
      blockers: [],
    });
    expect(unblocked.blockers).toHaveLength(0);

    // Add unblock note
    await appendNote(boardDir, card.id, {
      author: 'infra-bot',
      content: 'API key provisioned, blocker resolved',
      type: 'unblock',
    });

    // Verify final card state
    const final = await readCard(boardDir, card.id);
    expect(final).not.toBeNull();
    expect(final!.blockers).toHaveLength(0);
    expect(final!.notes).toHaveLength(2);
    expect(final!.notes[0].type).toBe('blocker');
    expect(final!.notes[1].type).toBe('unblock');
  });

  it('supports multiple simultaneous blockers', async () => {
    const card = await createCard(boardDir, {
      title: 'Multi-blocked card',
      source: 'manual',
    });

    const b1 = {
      id: generateBlockerId(),
      question: 'First blocker',
      author: 'user-a',
      created: new Date().toISOString(),
    };
    const b2 = {
      id: generateBlockerId(),
      question: 'Second blocker',
      author: 'user-b',
      created: new Date().toISOString(),
    };

    const blocked = await updateCard(boardDir, card.id, {
      blockers: [b1, b2],
    });
    expect(blocked.blockers).toHaveLength(2);

    // Remove first blocker only
    const partial = await updateCard(boardDir, card.id, {
      blockers: [b2],
    });
    expect(partial.blockers).toHaveLength(1);
    expect(partial.blockers[0].question).toBe('Second blocker');
  });
});
