export type ValidationSeverity = 'error' | 'warning';
export interface ValidationIssue {
    severity: ValidationSeverity;
    code: string;
    message: string;
    path?: string;
}
export declare function validateBoard(boardDir: string): Promise<ValidationIssue[]>;
//# sourceMappingURL=board-validator.d.ts.map