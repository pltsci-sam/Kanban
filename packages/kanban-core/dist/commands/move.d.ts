import type { Card } from '../models/card.js';
export declare function kanbanMove(boardDir: string, cardId: string, targetColumn: string): Promise<{
    card: Card;
    fromColumn: string;
}>;
export declare function kanbanDone(boardDir: string, cardId: string): Promise<{
    card: Card;
    fromColumn: string;
}>;
//# sourceMappingURL=move.d.ts.map