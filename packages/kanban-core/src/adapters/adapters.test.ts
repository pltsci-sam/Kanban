import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Card } from '../models/card.js';
import { RalphAdapter } from './ralph-adapter.js';
import { SpecopsAdapter } from './specops-adapter.js';
import { SpecArtifactAdapter } from './spec-artifact-adapter.js';
import { AdapterRegistry } from './registry.js';

function makeCard(id: string, overrides: Partial<Card> = {}): Card {
  return {
    id,
    title: `Card ${id}`,
    column: 'Backlog',
    priority: 'medium',
    labels: [],
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
    source: 'manual',
    blockers: [],
    description: '',
    notes: [],
    ...overrides,
  };
}

let repoRoot: string;

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'kanban-adapter-'));
  return async () => rm(repoRoot, { recursive: true });
});

describe('RalphAdapter', () => {
  const adapter = new RalphAdapter();

  it('returns false when features.json missing', async () => {
    expect(await adapter.isAvailable(repoRoot)).toBe(false);
  });

  it('enriches cards with ralph data', async () => {
    await mkdir(join(repoRoot, '.ralph'), { recursive: true });
    await writeFile(
      join(repoRoot, '.ralph', 'features.json'),
      JSON.stringify({
        'my-feature': {
          name: 'My Feature',
          phase: 'building',
          progress: 75,
          filesModified: ['a.ts', 'b.ts'],
          lastActivity: '2026-01-01T00:00:00Z',
        },
      })
    );

    const cards = [makeCard('a1b2c3', { ralphFeature: 'my-feature' })];
    const result = await adapter.enrich(repoRoot, cards);
    expect(result.get('a1b2c3')).toEqual({
      buildProgress: 75,
      phase: 'building',
      filesModified: 2,
    });
  });
});

describe('SpecopsAdapter', () => {
  const adapter = new SpecopsAdapter();

  it('returns false when state.json missing', async () => {
    expect(await adapter.isAvailable(repoRoot)).toBe(false);
  });

  it('enriches cards with specops data', async () => {
    await mkdir(join(repoRoot, '.specops'), { recursive: true });
    await writeFile(
      join(repoRoot, '.specops', 'state.json'),
      JSON.stringify({
        'user-auth': {
          phase: 'review',
          completedPhases: ['requirements', 'schemas'],
          lastActivity: '2026-01-01T00:00:00Z',
          status: 'active',
        },
      })
    );

    const cards = [makeCard('x1y2z3', { specRef: 'user-auth' })];
    const result = await adapter.enrich(repoRoot, cards);
    expect(result.get('x1y2z3')?.specPhase).toBe('review');
    expect(result.get('x1y2z3')?.completedPhases).toEqual(['requirements', 'schemas']);
  });
});

describe('SpecArtifactAdapter', () => {
  const adapter = new SpecArtifactAdapter();

  it('returns false when specs/ missing', async () => {
    expect(await adapter.isAvailable(repoRoot)).toBe(false);
  });

  it('enriches cards with spec artifact data', async () => {
    const specDir = join(repoRoot, 'specs', 'my-spec');
    await mkdir(specDir, { recursive: true });
    await writeFile(join(specDir, 'requirements.md'), '# Requirements\n');
    await writeFile(join(specDir, 'schemas.md'), '# Schemas\n');
    await writeFile(join(specDir, 'open-questions.md'), '# OQ\n## Q1\n## Q2\n');
    await writeFile(join(specDir, 'decisions.md'), '# Dec\n## D1\n');

    const cards = [makeCard('d4e5f6', { specRef: 'my-spec' })];
    const result = await adapter.enrich(repoRoot, cards);
    expect(result.get('d4e5f6')?.openQuestionCount).toBe(2);
    expect(result.get('d4e5f6')?.decisionCount).toBe(1);
    expect(result.get('d4e5f6')?.hasRequirements).toBe(true);
    expect(result.get('d4e5f6')?.hasSchema).toBe(true);
  });
});

describe('AdapterRegistry', () => {
  it('collects errors without throwing', async () => {
    const registry = new AdapterRegistry();
    const badAdapter = {
      name: 'ralph' as const,
      async isAvailable() { return true; },
      async enrich(): Promise<Map<string, never>> { throw new Error('boom'); },
    };
    registry.register(badAdapter);

    const cards = [makeCard('a1b2c3')];
    const result = await registry.enrichCards(repoRoot, cards, ['ralph']);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('boom');
  });
});
