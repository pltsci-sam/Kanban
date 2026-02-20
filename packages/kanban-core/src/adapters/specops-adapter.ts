import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { Card } from '../models/card.js';
import type { SpecopsEnrichment } from '../models/enrichment.js';
import type { KanbanAdapter } from './adapter.js';

interface SpecopsFeatureState {
  phase: string;
  completedPhases: string[];
  lastActivity: string;
  status: string;
}

export class SpecopsAdapter implements KanbanAdapter<SpecopsEnrichment> {
  readonly name = 'specops' as const;

  async isAvailable(repoRoot: string): Promise<boolean> {
    try {
      await access(join(repoRoot, '.specops', 'state.json'));
      return true;
    } catch {
      return false;
    }
  }

  async enrich(
    repoRoot: string,
    cards: Card[]
  ): Promise<Map<string, SpecopsEnrichment>> {
    const content = await readFile(
      join(repoRoot, '.specops', 'state.json'),
      'utf-8'
    );
    const state = JSON.parse(content) as Record<string, SpecopsFeatureState>;

    const result = new Map<string, SpecopsEnrichment>();
    for (const card of cards) {
      if (!card.specRef) continue;
      const entry = state[card.specRef];
      if (!entry) continue;

      result.set(card.id, {
        specPhase: entry.phase,
        completedPhases: entry.completedPhases,
        lastActivity: entry.lastActivity,
      });
    }

    return result;
  }
}
