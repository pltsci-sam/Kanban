import { createCard, appendNote } from '../card-writer.js';
import { readCard } from '../board-reader.js';
import type { CardCreateInput } from '../card-writer.js';
import type { Card } from '../models/card.js';

export interface ActionItemInput {
  title: string;
  description: string;
  meetingTitle: string;
  meetingDate: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  labels?: string[];
  assignee?: string;
}

export async function createCardFromActionItem(
  boardDir: string,
  input: ActionItemInput,
): Promise<Card> {
  const createInput: CardCreateInput = {
    title: input.title,
    column: 'Backlog',
    priority: input.priority || 'medium',
    description: input.description,
    labels: input.labels,
    assignee: input.assignee,
    source: 'vivian',
  };

  const card = await createCard(boardDir, createInput);

  await appendNote(boardDir, card.id, {
    author: 'vivian',
    type: 'comment',
    content: `Created from meeting: ${input.meetingTitle} (${input.meetingDate})`,
  });

  return card;
}

export async function readBlockerAnnouncement(
  boardDir: string,
  cardId: string,
): Promise<{ cardTitle: string; blockers: { question: string; author: string }[] } | null> {
  const card = await readCard(boardDir, cardId);
  if (!card) return null;

  return {
    cardTitle: card.title,
    blockers: (card.blockers || []).map(b => ({
      question: b.question,
      author: b.author,
    })),
  };
}
