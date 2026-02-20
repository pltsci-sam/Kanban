import type { Card } from '../models/card.js';
import type { SpecopsEnrichment } from '../models/enrichment.js';
import type { KanbanAdapter } from './adapter.js';
export declare class SpecopsAdapter implements KanbanAdapter<SpecopsEnrichment> {
    readonly name: "specops";
    isAvailable(repoRoot: string): Promise<boolean>;
    enrich(repoRoot: string, cards: Card[]): Promise<Map<string, SpecopsEnrichment>>;
}
//# sourceMappingURL=specops-adapter.d.ts.map