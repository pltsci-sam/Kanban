import { access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
export async function resolveBoardDir(startDir) {
    let dir = startDir;
    while (true) {
        const candidate = join(dir, '.kanban', 'board.yaml');
        try {
            await access(candidate);
            return join(dir, '.kanban');
        }
        catch {
            const parent = dirname(dir);
            if (parent === dir)
                return null;
            dir = parent;
        }
    }
}
//# sourceMappingURL=resolve-board.js.map