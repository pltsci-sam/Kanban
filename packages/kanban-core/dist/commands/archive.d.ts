import type { Card } from '../models/card.js';
export interface ArchiveOptions {
    days?: number;
    dryRun?: boolean;
}
export interface ArchiveResult {
    archived: Card[];
    skippedPinned: Card[];
}
export declare function kanbanArchive(boardDir: string, options?: ArchiveOptions): Promise<ArchiveResult>;
//# sourceMappingURL=archive.d.ts.map