import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Board } from './models/board.js';
import type { Card } from './models/card.js';
import { parseBoardYaml } from './parsers/board-parser.js';
import { parseCardMarkdown } from './parsers/card-parser.js';
import { BoardValidationError, CardParseError } from './errors.js';

export class BoardNotFoundError extends Error {
  constructor(boardDir: string) {
    super(`board.yaml not found in ${boardDir}`);
    this.name = 'BoardNotFoundError';
  }
}

export interface CardError {
  cardId: string;
  path: string;
  message: string;
}

export interface BoardState {
  board: Board;
  cards: Card[];
  errors: CardError[];
}

export async function readBoard(boardDir: string): Promise<BoardState> {
  const boardPath = join(boardDir, 'board.yaml');
  let boardContent: string;
  try {
    boardContent = await readFile(boardPath, 'utf-8');
  } catch {
    throw new BoardNotFoundError(boardDir);
  }

  const board = parseBoardYaml(boardContent);
  const cards: Card[] = [];
  const errors: CardError[] = [];

  const cardsDir = join(boardDir, 'cards');
  let files: string[];
  try {
    files = await readdir(cardsDir);
  } catch {
    files = [];
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const cardId = file.slice(0, -3);
    const cardPath = join(cardsDir, file);
    try {
      const content = await readFile(cardPath, 'utf-8');
      cards.push(parseCardMarkdown(content));
    } catch (err) {
      errors.push({
        cardId,
        path: cardPath,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { board, cards, errors };
}

export async function readCard(
  boardDir: string,
  cardId: string
): Promise<Card | null> {
  const cardPath = join(boardDir, 'cards', `${cardId}.md`);
  let content: string;
  try {
    content = await readFile(cardPath, 'utf-8');
  } catch {
    return null;
  }
  return parseCardMarkdown(content);
}
