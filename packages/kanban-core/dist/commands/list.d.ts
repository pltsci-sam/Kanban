import type { Card } from '../models/card.js';
export interface ListOptions {
    column?: string;
    blocked?: boolean;
    priority?: string;
    labels?: string[];
    assignee?: string;
}
export interface ListResult {
    cards: Card[];
    total: number;
    byColumn: Map<string, Card[]>;
}
export declare function kanbanList(boardDir: string, options?: ListOptions): Promise<ListResult>;
//# sourceMappingURL=list.d.ts.map