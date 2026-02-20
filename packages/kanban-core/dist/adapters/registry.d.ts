import type { Card } from '../models/card.js';
import type { AdapterType, CardEnrichment, RalphEnrichment, SpecopsEnrichment, SpecArtifactEnrichment } from '../models/enrichment.js';
import type { KanbanAdapter } from './adapter.js';
export interface AdapterError {
    adapter: AdapterType;
    message: string;
}
export interface EnrichmentResult {
    enrichments: Map<string, CardEnrichment>;
    errors: AdapterError[];
}
export declare class AdapterRegistry {
    private adapters;
    register(adapter: KanbanAdapter<RalphEnrichment | SpecopsEnrichment | SpecArtifactEnrichment>): void;
    enrichCards(repoRoot: string, cards: Card[], enabledAdapters: AdapterType[]): Promise<EnrichmentResult>;
}
//# sourceMappingURL=registry.d.ts.map