import type { Card, CardSource, Blocker, NoteType } from './models/card.js';
import type { CardPriority } from './models/board.js';
export declare class CardNotFoundError extends Error {
    constructor(cardId: string);
}
export declare class ColumnNotFoundError extends Error {
    constructor(columnName: string);
}
export declare class CardExistsError extends Error {
    constructor(cardId: string);
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
export declare function createCard(boardDir: string, input: CardCreateInput): Promise<Card>;
export declare function updateCard(boardDir: string, cardId: string, updates: CardUpdateInput): Promise<Card>;
export declare function moveCard(boardDir: string, cardId: string, targetColumn: string, position?: number): Promise<Card>;
export declare function appendNote(boardDir: string, cardId: string, note: NoteInput): Promise<Card>;
export declare function deleteCard(boardDir: string, cardId: string): Promise<void>;
export declare function archiveCard(boardDir: string, cardId: string): Promise<void>;
//# sourceMappingURL=card-writer.d.ts.map