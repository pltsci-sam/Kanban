import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
export class SpecopsAdapter {
    name = 'specops';
    async isAvailable(repoRoot) {
        try {
            await access(join(repoRoot, '.specops', 'state.json'));
            return true;
        }
        catch {
            return false;
        }
    }
    async enrich(repoRoot, cards) {
        const content = await readFile(join(repoRoot, '.specops', 'state.json'), 'utf-8');
        const state = JSON.parse(content);
        const result = new Map();
        for (const card of cards) {
            if (!card.specRef)
                continue;
            const entry = state[card.specRef];
            if (!entry)
                continue;
            result.set(card.id, {
                specPhase: entry.phase,
                completedPhases: entry.completedPhases,
                lastActivity: entry.lastActivity,
            });
        }
        return result;
    }
}
//# sourceMappingURL=specops-adapter.js.map