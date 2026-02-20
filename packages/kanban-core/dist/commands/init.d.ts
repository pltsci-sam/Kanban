export interface InitOptions {
    name?: string;
}
export interface InitResult {
    boardDir: string;
    boardName: string;
    columns: string[];
}
export declare function kanbanInit(repoRoot: string, options?: InitOptions): Promise<InitResult>;
//# sourceMappingURL=init.d.ts.map