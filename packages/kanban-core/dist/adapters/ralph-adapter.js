import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
export class RalphAdapter {
    name = 'ralph';
    async isAvailable(repoRoot) {
        try {
            await access(join(repoRoot, '.ralph', 'features.json'));
            return true;
        }
        catch {
            return false;
        }
    }
    async enrich(repoRoot, cards) {
        const content = await readFile(join(repoRoot, '.ralph', 'features.json'), 'utf-8');
        const data = JSON.parse(content);
        // Support both array-style features.json and object-keyed format
        const features = new Map();
        if (Array.isArray(data.features)) {
            for (const f of data.features) {
                features.set(f.name, f);
            }
        }
        else {
            for (const [key, val] of Object.entries(data)) {
                if (val && typeof val === 'object' && 'phase' in val) {
                    features.set(key, val);
                }
            }
        }
        const result = new Map();
        for (const card of cards) {
            if (!card.ralphFeature)
                continue;
            const feature = features.get(card.ralphFeature);
            if (!feature)
                continue;
            result.set(card.id, {
                buildProgress: feature.progress,
                phase: feature.phase,
                filesModified: feature.filesModified?.length,
            });
        }
        return result;
    }
}
//# sourceMappingURL=ralph-adapter.js.map