import { initializeBoard } from '../board-initializer.js';
import { readFile, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import yaml from 'js-yaml';
import type { Board } from '../models/board.js';

export interface InitOptions {
  name?: string;
}

export interface InitResult {
  boardDir: string;
  boardName: string;
  columns: string[];
}

export async function kanbanInit(
  repoRoot: string,
  options: InitOptions = {}
): Promise<InitResult> {
  const boardDir = await initializeBoard(repoRoot);
  const boardName = options.name ?? basename(repoRoot);

  if (options.name) {
    const boardPath = join(boardDir, 'board.yaml');
    const content = await readFile(boardPath, 'utf-8');
    const board = yaml.load(content) as Board;
    board.name = boardName;
    await writeFile(boardPath, yaml.dump(board, { lineWidth: -1, noRefs: true }));
  }

  const boardPath = join(boardDir, 'board.yaml');
  const content = await readFile(boardPath, 'utf-8');
  const board = yaml.load(content) as Board;
  const columns = board.columns.map((c) => c.name);

  return { boardDir, boardName: board.name, columns };
}
