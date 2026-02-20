import { readCard } from '../board-reader.js';
import { CardNotFoundError } from '../card-writer.js';
import type { Card } from '../models/card.js';

export async function kanbanShow(
  boardDir: string,
  cardId: string
): Promise<Card> {
  const card = await readCard(boardDir, cardId);
  if (!card) {
    throw new CardNotFoundError(cardId);
  }
  return card;
}
