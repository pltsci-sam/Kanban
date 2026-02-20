import type { Board } from './models/board.js';
import type { Card } from './models/card.js';
export declare class BoardNotFoundError extends Error {
    constructor(boardDir: string);
}
export interface CardError {
    cardId: string;
    path: string;
    message: string;
}
export interface BoardState {
    board: Board;
    cards: Card[];
    errors: CardError[];
}
export declare function readBoard(boardDir: string): Promise<BoardState>;
export declare function readCard(boardDir: string, cardId: string): Promise<Card | null>;
//# sourceMappingURL=board-reader.d.ts.map