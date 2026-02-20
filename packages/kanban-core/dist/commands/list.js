import { readBoard } from '../board-reader.js';
export async function kanbanList(boardDir, options = {}) {
    const { board, cards } = await readBoard(boardDir);
    let filtered = cards;
    if (options.column) {
        filtered = filtered.filter((c) => c.column === options.column);
    }
    if (options.blocked) {
        filtered = filtered.filter((c) => c.blockers.length > 0);
    }
    if (options.priority) {
        filtered = filtered.filter((c) => c.priority === options.priority);
    }
    if (options.labels && options.labels.length > 0) {
        filtered = filtered.filter((c) => options.labels.some((l) => c.labels.includes(l)));
    }
    if (options.assignee) {
        filtered = filtered.filter((c) => c.assignee === options.assignee);
    }
    // Sort by column order then by position in cardOrder
    const columnOrder = board.columns.map((c) => c.name);
    filtered.sort((a, b) => {
        const colA = columnOrder.indexOf(a.column);
        const colB = columnOrder.indexOf(b.column);
        if (colA !== colB)
            return colA - colB;
        const orderA = board.cardOrder[a.column]?.indexOf(a.id) ?? -1;
        const orderB = board.cardOrder[b.column]?.indexOf(b.id) ?? -1;
        return orderA - orderB;
    });
    const byColumn = new Map();
    for (const col of columnOrder) {
        const colCards = filtered.filter((c) => c.column === col);
        if (colCards.length > 0) {
            byColumn.set(col, colCards);
        }
    }
    return { cards: filtered, total: filtered.length, byColumn };
}
//# sourceMappingURL=list.js.map