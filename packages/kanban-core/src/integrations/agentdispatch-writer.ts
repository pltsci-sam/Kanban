import { createCard } from '../card-writer.js';
import { moveCard } from '../card-writer.js';
import { updateCard, appendNote } from '../card-writer.js';
import type { CardCreateInput, NoteInput } from '../card-writer.js';
import type { Card, Blocker } from '../models/card.js';
import { generateBlockerId } from '../id-generator.js';

export interface AgentDispatchCreateInput {
  boardDir: string;
  title: string;
  description: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  labels?: string[];
  assignee?: string;
}

export async function agentCreateCard(input: AgentDispatchCreateInput): Promise<Card> {
  const createInput: CardCreateInput = {
    title: input.title,
    column: 'Backlog',
    priority: input.priority || 'medium',
    description: input.description,
    labels: input.labels,
    assignee: input.assignee,
    source: 'agentdispatch',
  };

  return createCard(input.boardDir, createInput);
}

export async function agentMoveCard(
  boardDir: string,
  cardId: string,
  targetColumn: string,
  author: string,
): Promise<Card> {
  const card = await moveCard(boardDir, cardId, targetColumn);

  await appendNote(boardDir, cardId, {
    author,
    type: 'milestone',
    content: `Moved to ${targetColumn}`,
  });

  return card;
}

export async function agentAddBlocker(
  boardDir: string,
  cardId: string,
  question: string,
  author: string,
): Promise<Blocker> {
  const blockerId = generateBlockerId();
  const blocker: Blocker = {
    id: blockerId,
    question,
    author,
    created: new Date().toISOString(),
  };

  const { readCard } = await import('../board-reader.js');
  const card = await readCard(boardDir, cardId);
  if (!card) throw new Error(`Card ${cardId} not found`);

  const blockers = [...(card.blockers || []), blocker];
  await updateCard(boardDir, cardId, { blockers });

  await appendNote(boardDir, cardId, {
    author,
    type: 'blocker',
    content: `Blocked: ${question}`,
  });

  return blocker;
}

export async function agentRemoveBlocker(
  boardDir: string,
  cardId: string,
  blockerId: string,
  response: string,
  author: string,
): Promise<void> {
  const { readCard } = await import('../board-reader.js');
  const card = await readCard(boardDir, cardId);
  if (!card) throw new Error(`Card ${cardId} not found`);

  const blockers = (card.blockers || []).filter(b => b.id !== blockerId);
  await updateCard(boardDir, cardId, { blockers });

  await appendNote(boardDir, cardId, {
    author,
    type: 'unblock',
    content: `Unblocked ${blockerId}: ${response}`,
  });
}
