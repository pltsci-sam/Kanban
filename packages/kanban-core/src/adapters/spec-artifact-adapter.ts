import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { Card } from '../models/card.js';
import type { SpecArtifactEnrichment } from '../models/enrichment.js';
import type { KanbanAdapter } from './adapter.js';

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function countHeadings(filePath: string): Promise<number> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return (content.match(/^## /gm) || []).length;
  } catch {
    return 0;
  }
}

export class SpecArtifactAdapter implements KanbanAdapter<SpecArtifactEnrichment> {
  readonly name = 'specArtifact' as const;

  async isAvailable(repoRoot: string): Promise<boolean> {
    return fileExists(join(repoRoot, 'specs'));
  }

  async enrich(
    repoRoot: string,
    cards: Card[]
  ): Promise<Map<string, SpecArtifactEnrichment>> {
    const result = new Map<string, SpecArtifactEnrichment>();

    for (const card of cards) {
      if (!card.specRef) continue;
      const specDir = join(repoRoot, 'specs', card.specRef);
      if (!(await fileExists(specDir))) continue;

      result.set(card.id, {
        openQuestionCount: await countHeadings(join(specDir, 'open-questions.md')),
        decisionCount: await countHeadings(join(specDir, 'decisions.md')),
        hasRequirements: await fileExists(join(specDir, 'requirements.md')),
        hasSchema: await fileExists(join(specDir, 'schemas.md')),
      });
    }

    return result;
  }
}
