import { describe, it, expect } from 'vitest';
import { parseCardMarkdown, serializeCardMarkdown } from './card-parser.js';
import { CardParseError } from '../errors.js';

const VALID_CARD = `---
id: a1b2c3
title: "Test card"
column: Building
priority: high
labels: [backend]
assignee: agent-1
created: "2026-02-20T10:00:00Z"
updated: "2026-02-20T12:00:00Z"
source: agentdispatch
blockers: []
---

This is the card description.

## Notes

### 2026-02-20T11:00:00Z — agent-1 [milestone]

Completed first phase.

### 2026-02-20T12:00:00Z — human [comment]

Looks good so far.
`;

describe('parseCardMarkdown', () => {
  it('parses valid card with notes', () => {
    const card = parseCardMarkdown(VALID_CARD);
    expect(card.id).toBe('a1b2c3');
    expect(card.title).toBe('Test card');
    expect(card.priority).toBe('high');
    expect(card.description).toBe('This is the card description.');
    expect(card.notes).toHaveLength(2);
    expect(card.notes[0].author).toBe('agent-1');
    expect(card.notes[0].type).toBe('milestone');
    expect(card.notes[1].author).toBe('human');
    expect(card.notes[1].type).toBe('comment');
  });

  it('parses card with no notes', () => {
    const md = `---
id: x9y8z7
title: Simple
column: Backlog
priority: low
labels: []
created: "2026-01-01T00:00:00Z"
updated: "2026-01-01T00:00:00Z"
source: manual
blockers: []
---

Just a description.
`;
    const card = parseCardMarkdown(md);
    expect(card.notes).toHaveLength(0);
    expect(card.description).toBe('Just a description.');
  });

  it('throws on invalid card ID', () => {
    const md = `---
id: INVALID
title: Bad
column: X
priority: low
labels: []
created: "2026-01-01T00:00:00Z"
updated: "2026-01-01T00:00:00Z"
source: manual
blockers: []
---
`;
    expect(() => parseCardMarkdown(md)).toThrow(CardParseError);
  });

  it('throws on missing title', () => {
    const md = `---
id: a1b2c3
column: X
priority: low
labels: []
created: "2026-01-01T00:00:00Z"
updated: "2026-01-01T00:00:00Z"
source: manual
blockers: []
---
`;
    expect(() => parseCardMarkdown(md)).toThrow('title');
  });
});

describe('serializeCardMarkdown', () => {
  it('round-trips a card', () => {
    const card = parseCardMarkdown(VALID_CARD);
    const serialized = serializeCardMarkdown(card);
    const reparsed = parseCardMarkdown(serialized);
    expect(reparsed.id).toBe(card.id);
    expect(reparsed.title).toBe(card.title);
    expect(reparsed.notes).toHaveLength(card.notes.length);
  });
});
