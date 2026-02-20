import { createCard } from '../card-writer.js';
export async function kanbanAdd(boardDir, options) {
    const input = {
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
//# sourceMappingURL=add.js.map