import { initializeBoard } from '../board-initializer.js';
import { readFile, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import yaml from 'js-yaml';
export async function kanbanInit(repoRoot, options = {}) {
    const boardDir = await initializeBoard(repoRoot);
    const boardName = options.name ?? basename(repoRoot);
    if (options.name) {
        const boardPath = join(boardDir, 'board.yaml');
        const content = await readFile(boardPath, 'utf-8');
        const board = yaml.load(content);
        board.name = boardName;
        await writeFile(boardPath, yaml.dump(board, { lineWidth: -1, noRefs: true }));
    }
    const boardPath = join(boardDir, 'board.yaml');
    const content = await readFile(boardPath, 'utf-8');
    const board = yaml.load(content);
    const columns = board.columns.map((c) => c.name);
    return { boardDir, boardName: board.name, columns };
}
//# sourceMappingURL=init.js.map