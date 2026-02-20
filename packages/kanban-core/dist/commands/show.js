import { readCard } from '../board-reader.js';
import { CardNotFoundError } from '../card-writer.js';
export async function kanbanShow(boardDir, cardId) {
    const card = await readCard(boardDir, cardId);
    if (!card) {
        throw new CardNotFoundError(cardId);
    }
    return card;
}
//# sourceMappingURL=show.js.map