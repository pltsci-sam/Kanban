export class AdapterRegistry {
    adapters = new Map();
    register(adapter) {
        this.adapters.set(adapter.name, adapter);
    }
    async enrichCards(repoRoot, cards, enabledAdapters) {
        const enrichments = new Map();
        const errors = [];
        // Initialize enrichments for all cards
        for (const card of cards) {
            enrichments.set(card.id, {});
        }
        for (const adapterType of enabledAdapters) {
            const adapter = this.adapters.get(adapterType);
            if (!adapter)
                continue;
            try {
                const available = await adapter.isAvailable(repoRoot);
                if (!available)
                    continue;
                const results = await adapter.enrich(repoRoot, cards);
                for (const [cardId, enrichment] of results) {
                    const existing = enrichments.get(cardId) ?? {};
                    existing[adapterType] = enrichment;
                    enrichments.set(cardId, existing);
                }
            }
            catch (err) {
                errors.push({
                    adapter: adapterType,
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        }
        return { enrichments, errors };
    }
}
//# sourceMappingURL=registry.js.map