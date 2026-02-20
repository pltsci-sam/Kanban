import { readBoard } from '../board-reader.js';
import { moveCard } from '../card-writer.js';
import type { Card } from '../models/card.js';

export async function kanbanMove(
  boardDir: string,
  cardId: string,
  targetColumn: string
): Promise<{ card: Card; fromColumn: string }> {
  const { board } = await readBoard(boardDir);
  // Find current column from cardOrder
  let fromColumn = 'unknown';
  for (const [col, ids] of Object.entries(board.cardOrder)) {
    if (ids.includes(cardId)) {
      fromColumn = col;
      break;
    }
  }

  const card = await moveCard(boardDir, cardId, targetColumn);
  return { card, fromColumn };
}

export async function kanbanDone(
  boardDir: string,
  cardId: string
): Promise<{ card: Card; fromColumn: string }> {
  const { board } = await readBoard(boardDir);
  const doneColumn = board.columns.find((c) => c.done);
  if (!doneColumn) {
    throw new Error('No done column configured in board.yaml');
  }
  return kanbanMove(boardDir, cardId, doneColumn.name);
}
