import type { Card } from '../models/card.js';
import type { SpecArtifactEnrichment } from '../models/enrichment.js';
import type { KanbanAdapter } from './adapter.js';
export declare class SpecArtifactAdapter implements KanbanAdapter<SpecArtifactEnrichment> {
    readonly name: "specArtifact";
    isAvailable(repoRoot: string): Promise<boolean>;
    enrich(repoRoot: string, cards: Card[]): Promise<Map<string, SpecArtifactEnrichment>>;
}
//# sourceMappingURL=spec-artifact-adapter.d.ts.map