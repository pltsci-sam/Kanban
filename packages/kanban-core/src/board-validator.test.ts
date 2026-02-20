import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateBoard } from './board-validator.js';

const makeBoardYaml = (cardOrder: Record<string, string[]>) => `
name: Test
version: 1
columns:
  - name: Backlog
  - name: Done
    done: true
labels:
  - name: backend
    color: "#3498db"
cardOrder:
${Object.entries(cardOrder)
  .map(([col, ids]) => `  ${col}: [${ids.join(', ')}]`)
  .join('\n')}
settings:
  autoArchiveDays: 30
  defaultPriority: medium
  defaultColumn: Backlog
  idFormat: alphanumeric6
`;

const makeCard = (id: string, column: string, opts: Record<string, unknown> = {}) => `---
id: ${id}
title: "Card ${id}"
column: ${column}
priority: medium
labels: ${JSON.stringify(opts.labels ?? [])}
created: "2026-01-01T00:00:00Z"
updated: "2026-01-01T00:00:00Z"
source: manual
blockers: []
${opts.specRef ? `specRef: "${opts.specRef}"` : ''}
${opts.ralphFeature ? `ralphFeature: "${opts.ralphFeature}"` : ''}
---

Description.
`;

let boardDir: string;

beforeEach(async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'kanban-val-'));
  boardDir = join(tmp, '.kanban');
  await mkdir(join(boardDir, 'cards'), { recursive: true });
  return async () => rm(tmp, { recursive: true });
});

describe('validateBoard', () => {
  it('passes for consistent board', async () => {
    await writeFile(join(boardDir, 'board.yaml'), makeBoardYaml({ Backlog: ['a1b2c3'], Done: [] }));
    await writeFile(join(boardDir, 'cards', 'a1b2c3.md'), makeCard('a1b2c3', 'Backlog'));
    const issues = await validateBoard(boardDir);
    expect(issues).toHaveLength(0);
  });

  it('detects ghost card references', async () => {
    await writeFile(join(boardDir, 'board.yaml'), makeBoardYaml({ Backlog: ['zzzzzz'], Done: [] }));
    const issues = await validateBoard(boardDir);
    expect(issues.some((i) => i.code === 'GHOST_CARD_REFERENCE')).toBe(true);
  });

  it('detects orphan cards', async () => {
    await writeFile(join(boardDir, 'board.yaml'), makeBoardYaml({ Backlog: [], Done: [] }));
    await writeFile(join(boardDir, 'cards', 'a1b2c3.md'), makeCard('a1b2c3', 'Backlog'));
    const issues = await validateBoard(boardDir);
    expect(issues.some((i) => i.code === 'ORPHAN_CARD')).toBe(true);
  });

  it('detects path traversal in specRef', async () => {
    await writeFile(join(boardDir, 'board.yaml'), makeBoardYaml({ Backlog: ['a1b2c3'], Done: [] }));
    await writeFile(join(boardDir, 'cards', 'a1b2c3.md'), makeCard('a1b2c3', 'Backlog', { specRef: '../../../etc/passwd' }));
    const issues = await validateBoard(boardDir);
    expect(issues.some((i) => i.code === 'PATH_TRAVERSAL_SPECREF')).toBe(true);
  });

  it('detects unknown labels', async () => {
    await writeFile(join(boardDir, 'board.yaml'), makeBoardYaml({ Backlog: ['a1b2c3'], Done: [] }));
    await writeFile(join(boardDir, 'cards', 'a1b2c3.md'), makeCard('a1b2c3', 'Backlog', { labels: ['nonexistent'] }));
    const issues = await validateBoard(boardDir);
    expect(issues.some((i) => i.code === 'UNKNOWN_LABEL')).toBe(true);
  });
});
