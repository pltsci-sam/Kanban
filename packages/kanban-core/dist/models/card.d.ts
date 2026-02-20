import type { CardPriority } from './board.js';
export type CardSource = 'manual' | 'agentdispatch' | 'vivian' | 'slack';
export type NoteType = 'comment' | 'milestone' | 'blocker' | 'unblock';
export interface Blocker {
    id: string;
    question: string;
    author: string;
    created: string;
}
export interface Note {
    timestamp: string;
    author: string;
    content: string;
    type?: NoteType;
}
export interface Card {
    id: string;
    title: string;
    column: string;
    priority: CardPriority;
    labels: string[];
    assignee?: string;
    created: string;
    updated: string;
    due?: string;
    source: CardSource;
    pin?: boolean;
    blockers: Blocker[];
    specRef?: string;
    ralphFeature?: string;
    meeting?: string;
    description: string;
    notes: Note[];
}
//# sourceMappingURL=card.d.ts.map