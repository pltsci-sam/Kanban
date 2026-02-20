import matter from 'gray-matter';
import type { Card, Note, NoteType } from '../models/card.js';
import { CardParseError } from '../errors.js';

const NOTE_HEADING_RE =
  /^###\s+(\S+)\s+—\s+(\S+)\s*(?:\[(\w+)\])?$/;

function parseNotes(body: string): { description: string; notes: Note[] } {
  const notesHeaderIndex = body.indexOf('## Notes');
  if (notesHeaderIndex === -1) {
    return { description: body.trim(), notes: [] };
  }

  const description = body.slice(0, notesHeaderIndex).trim();
  const notesSection = body.slice(notesHeaderIndex);
  const lines = notesSection.split('\n');
  const notes: Note[] = [];
  let current: Note | null = null;
  const contentLines: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const match = NOTE_HEADING_RE.exec(lines[i]);
    if (match) {
      if (current) {
        current.content = contentLines.join('\n').trim();
        notes.push(current);
        contentLines.length = 0;
      }
      current = {
        timestamp: match[1],
        author: match[2],
        content: '',
        type: match[3] as NoteType | undefined,
      };
    } else if (current) {
      contentLines.push(lines[i]);
    }
  }

  if (current) {
    current.content = contentLines.join('\n').trim();
    notes.push(current);
  }

  return { description, notes };
}

export function parseCardMarkdown(content: string): Card {
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(content);
  } catch (err) {
    throw new CardParseError(
      `Invalid frontmatter: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const data = parsed.data as Record<string, unknown>;

  if (typeof data.id !== 'string' || !/^[a-z0-9]{6}$/.test(data.id)) {
    throw new CardParseError(
      `Card "id" must be a 6-char lowercase alphanumeric string, got: "${String(data.id)}"`
    );
  }

  if (typeof data.title !== 'string' || data.title.length === 0) {
    throw new CardParseError('Card must have a non-empty "title" string');
  }

  const { description, notes } = parseNotes(parsed.content);

  return {
    id: data.id as string,
    title: data.title as string,
    column: data.column as string,
    priority: data.priority as Card['priority'],
    labels: (data.labels as string[]) ?? [],
    assignee: data.assignee as string | undefined,
    created: data.created as string,
    updated: data.updated as string,
    due: data.due as string | undefined,
    source: data.source as Card['source'],
    pin: data.pin as boolean | undefined,
    blockers: (data.blockers as Card['blockers']) ?? [],
    specRef: data.specRef as string | undefined,
    ralphFeature: data.ralphFeature as string | undefined,
    meeting: data.meeting as string | undefined,
    description,
    notes,
  };
}

export function serializeCardMarkdown(card: Card): string {
  const frontmatter: Record<string, unknown> = {
    id: card.id,
    title: card.title,
    column: card.column,
    priority: card.priority,
    labels: card.labels,
  };

  if (card.assignee) frontmatter.assignee = card.assignee;
  frontmatter.created = card.created;
  frontmatter.updated = card.updated;
  if (card.due) frontmatter.due = card.due;
  frontmatter.source = card.source;
  if (card.pin) frontmatter.pin = card.pin;
  frontmatter.blockers = card.blockers;
  if (card.specRef) frontmatter.specRef = card.specRef;
  if (card.ralphFeature) frontmatter.ralphFeature = card.ralphFeature;
  if (card.meeting) frontmatter.meeting = card.meeting;

  let body = card.description;

  if (card.notes.length > 0) {
    body += '\n\n## Notes\n';
    for (const note of card.notes) {
      const typeTag = note.type ? ` [${note.type}]` : '';
      body += `\n### ${note.timestamp} — ${note.author}${typeTag}\n\n${note.content}\n`;
    }
  }

  return matter.stringify(body, frontmatter);
}
