import { access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { serializeBoardYaml } from './parsers/board-parser.js';
import { writeFileAtomic } from './atomic-writer.js';
export class BoardExistsError extends Error {
    constructor(boardDir) {
        super(`.kanban/ already exists at ${boardDir}`);
        this.name = 'BoardExistsError';
    }
}
const DEFAULT_BOARD = {
    name: 'AIFactory SDLC',
    version: 1,
    columns: [
        { name: 'Backlog', description: 'Work items waiting to be started' },
        { name: 'Spec Creation', wipLimit: 3, description: 'Requirements and schema design in progress' },
        { name: 'Spec Review', wipLimit: 2, description: 'Specs awaiting human review' },
        { name: 'Building', wipLimit: 3, description: 'Implementation in progress' },
        { name: 'Testing', wipLimit: 3, description: 'Verification and testing in progress' },
        { name: 'Human Review', wipLimit: 2, description: 'Awaiting human sign-off' },
        { name: 'Done', done: true, description: 'Completed work' },
    ],
    labels: [
        { name: 'security', color: '#e74c3c' },
        { name: 'backend', color: '#3498db' },
        { name: 'frontend', color: '#2ecc71' },
        { name: 'infra', color: '#9b59b6' },
        { name: 'bug', color: '#e67e22' },
        { name: 'spec', color: '#1abc9c' },
    ],
    cardOrder: {
        'Backlog': [],
        'Spec Creation': [],
        'Spec Review': [],
        'Building': [],
        'Testing': [],
        'Human Review': [],
        'Done': [],
    },
    settings: {
        autoArchiveDays: 30,
        defaultPriority: 'medium',
        defaultColumn: 'Backlog',
        idFormat: 'alphanumeric6',
    },
};
export async function initializeBoard(repoRoot) {
    const boardDir = join(repoRoot, '.kanban');
    try {
        await access(boardDir);
        throw new BoardExistsError(boardDir);
    }
    catch (err) {
        if (err instanceof BoardExistsError)
            throw err;
        // Directory doesn't exist — proceed
    }
    await mkdir(join(boardDir, 'cards'), { recursive: true });
    await mkdir(join(boardDir, 'archive'), { recursive: true });
    await writeFileAtomic(join(boardDir, 'board.yaml'), serializeBoardYaml(DEFAULT_BOARD));
    return boardDir;
}
//# sourceMappingURL=board-initializer.js.map