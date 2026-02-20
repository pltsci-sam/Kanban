import type { Card } from '../models/card.js';
import type {
  AdapterType,
  CardEnrichment,
  RalphEnrichment,
  SpecopsEnrichment,
  SpecArtifactEnrichment,
} from '../models/enrichment.js';
import type { KanbanAdapter } from './adapter.js';

export interface AdapterError {
  adapter: AdapterType;
  message: string;
}

export interface EnrichmentResult {
  enrichments: Map<string, CardEnrichment>;
  errors: AdapterError[];
}

export class AdapterRegistry {
  private adapters = new Map<
    AdapterType,
    KanbanAdapter<RalphEnrichment | SpecopsEnrichment | SpecArtifactEnrichment>
  >();

  register(
    adapter: KanbanAdapter<RalphEnrichment | SpecopsEnrichment | SpecArtifactEnrichment>
  ): void {
    this.adapters.set(adapter.name, adapter);
  }

  async enrichCards(
    repoRoot: string,
    cards: Card[],
    enabledAdapters: AdapterType[]
  ): Promise<EnrichmentResult> {
    const enrichments = new Map<string, CardEnrichment>();
    const errors: AdapterError[] = [];

    // Initialize enrichments for all cards
    for (const card of cards) {
      enrichments.set(card.id, {});
    }

    for (const adapterType of enabledAdapters) {
      const adapter = this.adapters.get(adapterType);
      if (!adapter) continue;

      try {
        const available = await adapter.isAvailable(repoRoot);
        if (!available) continue;

        const results = await adapter.enrich(repoRoot, cards);

        for (const [cardId, enrichment] of results) {
          const existing = enrichments.get(cardId) ?? {};
          existing[adapterType] = enrichment as never;
          enrichments.set(cardId, existing);
        }
      } catch (err) {
        errors.push({
          adapter: adapterType,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { enrichments, errors };
  }
}
