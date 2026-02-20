import { rename, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Board } from './models/board.js';
import type { Card, CardSource, Blocker, NoteType } from './models/card.js';
import type { CardPriority } from './models/board.js';
import { readBoard, readCard } from './board-reader.js';
import { generateCardId } from './id-generator.js';
import { serializeCardMarkdown } from './parsers/card-parser.js';
import { serializeBoardYaml } from './parsers/board-parser.js';
import { writeFileAtomic } from './atomic-writer.js';

export class CardNotFoundError extends Error {
  constructor(cardId: string) {
    super(`Card not found: ${cardId}`);
    this.name = 'CardNotFoundError';
  }
}

export class ColumnNotFoundError extends Error {
  constructor(columnName: string) {
    super(`Column not found: ${columnName}`);
    this.name = 'ColumnNotFoundError';
  }
}

export class CardExistsError extends Error {
  constructor(cardId: string) {
    super(`Card already exists: ${cardId}`);
    this.name = 'CardExistsError';
  }
}

export interface CardCreateInput {
  title: string;
  column?: string;
  priority?: CardPriority;
  labels?: string[];
  assignee?: string;
  description?: string;
  source: CardSource;
  due?: string;
  specRef?: string;
  ralphFeature?: string;
  meeting?: string;
  blockers?: Blocker[];
}

export interface CardUpdateInput {
  title?: string;
  column?: string;
  priority?: CardPriority;
  labels?: string[];
  assignee?: string;
  description?: string;
  due?: string;
  pin?: boolean;
  blockers?: Blocker[];
  specRef?: string;
  ralphFeature?: string;
}

export interface NoteInput {
  author: string;
  content: string;
  type?: NoteType;
}

function validateColumn(board: Board, columnName: string): void {
  if (!board.columns.some((c) => c.name === columnName)) {
    throw new ColumnNotFoundError(columnName);
  }
}

async function writeBoardYaml(
  boardDir: string,
  board: Board
): Promise<void> {
  await writeFileAtomic(join(boardDir, 'board.yaml'), serializeBoardYaml(board));
}

export async function createCard(
  boardDir: string,
  input: CardCreateInput
): Promise<Card> {
  const { board } = await readBoard(boardDir);
  const column = input.column ?? board.settings.defaultColumn;
  validateColumn(board, column);

  const id = await generateCardId(boardDir);
  const cardPath = join(boardDir, 'cards', `${id}.md`);

  const existing = await readCard(boardDir, id);
  if (existing) {
    throw new CardExistsError(id);
  }

  const now = new Date().toISOString();
  const card: Card = {
    id,
    title: input.title,
    column,
    priority: input.priority ?? board.settings.defaultPriority,
    labels: input.labels ?? [],
    assignee: input.assignee,
    created: now,
    updated: now,
    due: input.due,
    source: input.source,
    pin: undefined,
    blockers: input.blockers ?? [],
    specRef: input.specRef,
    ralphFeature: input.ralphFeature,
    meeting: input.meeting,
    description: input.description ?? '',
    notes: [],
  };

  await mkdir(join(boardDir, 'cards'), { recursive: true });
  await writeFileAtomic(cardPath, serializeCardMarkdown(card));

  if (!board.cardOrder[column]) {
    board.cardOrder[column] = [];
  }
  board.cardOrder[column].push(id);
  await writeBoardYaml(boardDir, board);

  return card;
}

export async function updateCard(
  boardDir: string,
  cardId: string,
  updates: CardUpdateInput
): Promise<Card> {
  const { board } = await readBoard(boardDir);
  const card = await readCard(boardDir, cardId);
  if (!card) {
    throw new CardNotFoundError(cardId);
  }

  if (updates.column !== undefined) {
    validateColumn(board, updates.column);
  }

  const updated: Card = {
    ...card,
    ...updates,
    updated: new Date().toISOString(),
    notes: card.notes,
  };

  await writeFileAtomic(
    join(boardDir, 'cards', `${cardId}.md`),
    serializeCardMarkdown(updated)
  );

  return updated;
}

export async function moveCard(
  boardDir: string,
  cardId: string,
  targetColumn: string,
  position?: number
): Promise<Card> {
  const { board } = await readBoard(boardDir);
  validateColumn(board, targetColumn);

  const card = await readCard(boardDir, cardId);
  if (!card) {
    throw new CardNotFoundError(cardId);
  }

  // Remove from current column
  const currentOrder = board.cardOrder[card.column];
  if (currentOrder) {
    const idx = currentOrder.indexOf(cardId);
    if (idx !== -1) currentOrder.splice(idx, 1);
  }

  // Add to target column
  if (!board.cardOrder[targetColumn]) {
    board.cardOrder[targetColumn] = [];
  }
  const targetOrder = board.cardOrder[targetColumn];
  if (position !== undefined && position >= 0 && position < targetOrder.length) {
    targetOrder.splice(position, 0, cardId);
  } else {
    targetOrder.push(cardId);
  }

  card.column = targetColumn;
  card.updated = new Date().toISOString();

  await writeFileAtomic(
    join(boardDir, 'cards', `${cardId}.md`),
    serializeCardMarkdown(card)
  );
  await writeBoardYaml(boardDir, board);

  return card;
}

export async function appendNote(
  boardDir: string,
  cardId: string,
  note: NoteInput
): Promise<Card> {
  const card = await readCard(boardDir, cardId);
  if (!card) {
    throw new CardNotFoundError(cardId);
  }

  card.notes.push({
    timestamp: new Date().toISOString(),
    author: note.author,
    content: note.content,
    type: note.type,
  });
  card.updated = new Date().toISOString();

  await writeFileAtomic(
    join(boardDir, 'cards', `${cardId}.md`),
    serializeCardMarkdown(card)
  );

  return card;
}

export async function deleteCard(
  boardDir: string,
  cardId: string
): Promise<void> {
  const { board } = await readBoard(boardDir);
  const card = await readCard(boardDir, cardId);
  if (!card) {
    throw new CardNotFoundError(cardId);
  }

  // Remove from cardOrder
  for (const col of Object.keys(board.cardOrder)) {
    const order = board.cardOrder[col];
    const idx = order.indexOf(cardId);
    if (idx !== -1) order.splice(idx, 1);
  }

  await unlink(join(boardDir, 'cards', `${cardId}.md`));
  await writeBoardYaml(boardDir, board);
}

export async function archiveCard(
  boardDir: string,
  cardId: string
): Promise<void> {
  const { board } = await readBoard(boardDir);
  const card = await readCard(boardDir, cardId);
  if (!card) {
    throw new CardNotFoundError(cardId);
  }

  // Remove from cardOrder
  for (const col of Object.keys(board.cardOrder)) {
    const order = board.cardOrder[col];
    const idx = order.indexOf(cardId);
    if (idx !== -1) order.splice(idx, 1);
  }

  const archiveDir = join(boardDir, 'archive');
  await mkdir(archiveDir, { recursive: true });
  await rename(
    join(boardDir, 'cards', `${cardId}.md`),
    join(archiveDir, `${cardId}.md`)
  );
  await writeBoardYaml(boardDir, board);
}
