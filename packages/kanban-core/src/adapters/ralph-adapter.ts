import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { Card } from '../models/card.js';
import type { RalphEnrichment } from '../models/enrichment.js';
import type { KanbanAdapter } from './adapter.js';

interface RalphFeatureEntry {
  name: string;
  phase: string;
  progress: number;
  filesModified: string[];
  lastActivity: string;
}

export class RalphAdapter implements KanbanAdapter<RalphEnrichment> {
  readonly name = 'ralph' as const;

  async isAvailable(repoRoot: string): Promise<boolean> {
    try {
      await access(join(repoRoot, '.ralph', 'features.json'));
      return true;
    } catch {
      return false;
    }
  }

  async enrich(
    repoRoot: string,
    cards: Card[]
  ): Promise<Map<string, RalphEnrichment>> {
    const content = await readFile(
      join(repoRoot, '.ralph', 'features.json'),
      'utf-8'
    );
    const data = JSON.parse(content) as { features?: RalphFeatureEntry[] } & Record<string, RalphFeatureEntry>;

    // Support both array-style features.json and object-keyed format
    const features = new Map<string, RalphFeatureEntry>();
    if (Array.isArray(data.features)) {
      for (const f of data.features) {
        features.set(f.name, f);
      }
    } else {
      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && 'phase' in val) {
          features.set(key, val);
        }
      }
    }

    const result = new Map<string, RalphEnrichment>();
    for (const card of cards) {
      if (!card.ralphFeature) continue;
      const feature = features.get(card.ralphFeature);
      if (!feature) continue;

      result.set(card.id, {
        buildProgress: feature.progress,
        phase: feature.phase,
        filesModified: feature.filesModified?.length,
      });
    }

    return result;
  }
}
