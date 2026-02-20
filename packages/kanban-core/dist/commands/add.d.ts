import type { Card } from '../models/card.js';
export interface AddOptions {
    title: string;
    column?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    labels?: string[];
    assignee?: string;
    due?: string;
    description?: string;
    specRef?: string;
    ralphFeature?: string;
}
export declare function kanbanAdd(boardDir: string, options: AddOptions): Promise<Card>;
//# sourceMappingURL=add.d.ts.map