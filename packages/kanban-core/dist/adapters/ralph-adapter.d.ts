import type { Card } from '../models/card.js';
import type { RalphEnrichment } from '../models/enrichment.js';
import type { KanbanAdapter } from './adapter.js';
export declare class RalphAdapter implements KanbanAdapter<RalphEnrichment> {
    readonly name: "ralph";
    isAvailable(repoRoot: string): Promise<boolean>;
    enrich(repoRoot: string, cards: Card[]): Promise<Map<string, RalphEnrichment>>;
}
//# sourceMappingURL=ralph-adapter.d.ts.map