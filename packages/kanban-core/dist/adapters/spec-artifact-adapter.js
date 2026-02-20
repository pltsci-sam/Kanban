import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
async function fileExists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
async function countHeadings(filePath) {
    try {
        const content = await readFile(filePath, 'utf-8');
        return (content.match(/^## /gm) || []).length;
    }
    catch {
        return 0;
    }
}
export class SpecArtifactAdapter {
    name = 'specArtifact';
    async isAvailable(repoRoot) {
        return fileExists(join(repoRoot, 'specs'));
    }
    async enrich(repoRoot, cards) {
        const result = new Map();
        for (const card of cards) {
            if (!card.specRef)
                continue;
            const specDir = join(repoRoot, 'specs', card.specRef);
            if (!(await fileExists(specDir)))
                continue;
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
//# sourceMappingURL=spec-artifact-adapter.js.map