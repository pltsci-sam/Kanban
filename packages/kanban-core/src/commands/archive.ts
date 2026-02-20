import { readBoard } from '../board-reader.js';
import { archiveCard } from '../card-writer.js';
import type { Card } from '../models/card.js';

export interface ArchiveOptions {
  days?: number;
  dryRun?: boolean;
}

export interface ArchiveResult {
  archived: Card[];
  skippedPinned: Card[];
}

export async function kanbanArchive(
  boardDir: string,
  options: ArchiveOptions = {}
): Promise<ArchiveResult> {
  const { board, cards } = await readBoard(boardDir);
  const days = options.days ?? board.settings.autoArchiveDays;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  // Find done column
  const doneColumn = board.columns.find((c) => c.done);
  if (!doneColumn) {
    return { archived: [], skippedPinned: [] };
  }

  const doneCards = cards.filter((c) => c.column === doneColumn.name);
  const archived: Card[] = [];
  const skippedPinned: Card[] = [];

  for (const card of doneCards) {
    const updatedTime = new Date(card.updated).getTime();
    if (updatedTime > cutoff) continue;

    if (card.pin) {
      skippedPinned.push(card);
      continue;
    }

    if (!options.dryRun) {
      await archiveCard(boardDir, card.id);
    }
    archived.push(card);
  }

  return { archived, skippedPinned };
}
