import type { Card } from '../models/card.js';
import type { AdapterType } from '../models/enrichment.js';

export interface KanbanAdapter<TEnrichment> {
  readonly name: AdapterType;
  isAvailable(repoRoot: string): Promise<boolean>;
  enrich(repoRoot: string, cards: Card[]): Promise<Map<string, TEnrichment>>;
}
