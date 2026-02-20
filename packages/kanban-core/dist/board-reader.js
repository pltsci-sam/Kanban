import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseBoardYaml } from './parsers/board-parser.js';
import { parseCardMarkdown } from './parsers/card-parser.js';
export class BoardNotFoundError extends Error {
    constructor(boardDir) {
        super(`board.yaml not found in ${boardDir}`);
        this.name = 'BoardNotFoundError';
    }
}
export async function readBoard(boardDir) {
    const boardPath = join(boardDir, 'board.yaml');
    let boardContent;
    try {
        boardContent = await readFile(boardPath, 'utf-8');
    }
    catch {
        throw new BoardNotFoundError(boardDir);
    }
    const board = parseBoardYaml(boardContent);
    const cards = [];
    const errors = [];
    const cardsDir = join(boardDir, 'cards');
    let files;
    try {
        files = await readdir(cardsDir);
    }
    catch {
        files = [];
    }
    for (const file of files) {
        if (!file.endsWith('.md'))
            continue;
        const cardId = file.slice(0, -3);
        const cardPath = join(cardsDir, file);
        try {
            const content = await readFile(cardPath, 'utf-8');
            cards.push(parseCardMarkdown(content));
        }
        catch (err) {
            errors.push({
                cardId,
                path: cardPath,
                message: err instanceof Error ? err.message : String(err),
            });
        }
    }
    return { board, cards, errors };
}
export async function readCard(boardDir, cardId) {
    const cardPath = join(boardDir, 'cards', `${cardId}.md`);
    let content;
    try {
        content = await readFile(cardPath, 'utf-8');
    }
    catch {
        return null;
    }
    return parseCardMarkdown(content);
}
//# sourceMappingURL=board-reader.js.map