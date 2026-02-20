import { createCard } from '../card-writer.js';
import type { CardCreateInput } from '../card-writer.js';
import type { Card } from '../models/card.js';

export interface AddOptions {
  title: string;
  column?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  labels?: string[];
  assignee?: string;
  due?: string;
  description?: string;
  specRef?: string;
  ralphFeature?: string;
}

export async function kanbanAdd(
  boardDir: string,
  options: AddOptions
): Promise<Card> {
  const input: CardCreateInput = {
    title: options.title,
    column: options.column,
    priority: options.priority,
    labels: options.labels,
    assignee: options.assignee,
    due: options.due,
    description: options.description,
    source: 'manual',
    specRef: options.specRef,
    ralphFeature: options.ralphFeature,
  };

  return createCard(boardDir, input);
}
