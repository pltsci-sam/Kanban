import * as vscode from 'vscode';
import { join } from 'node:path';

export class KanbanFileWatcher implements vscode.Disposable {
  private watcher?: vscode.FileSystemWatcher;
  private debounceTimer?: ReturnType<typeof setTimeout>;
  private readonly debounceMs: number;

  constructor(
    private readonly onBoardChanged: () => void,
    debounceMs = 300,
  ) {
    this.debounceMs = debounceMs;
  }

  start(boardDir: string): void {
    this.dispose();

    const kanbanDir = join(boardDir, '.kanban');
    const pattern = new vscode.RelativePattern(kanbanDir, '**/*');
    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

    const trigger = () => this.debouncedRefresh();
    this.watcher.onDidChange(trigger);
    this.watcher.onDidCreate(trigger);
    this.watcher.onDidDelete(trigger);
  }

  private debouncedRefresh(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.onBoardChanged();
    }, this.debounceMs);
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = undefined;
    }
  }
}
