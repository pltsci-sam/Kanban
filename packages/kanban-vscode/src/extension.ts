import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  const openBoardCmd = vscode.commands.registerCommand('kanban.openBoard', () => {
    vscode.window.showInformationMessage('Kanban: Open Board (not yet implemented)');
  });

  const initBoardCmd = vscode.commands.registerCommand('kanban.initBoard', () => {
    vscode.window.showInformationMessage('Kanban: Initialize Board (not yet implemented)');
  });

  const addCardCmd = vscode.commands.registerCommand('kanban.addCard', () => {
    vscode.window.showInformationMessage('Kanban: Add Card (not yet implemented)');
  });

  const refreshBoardCmd = vscode.commands.registerCommand('kanban.refreshBoard', () => {
    vscode.window.showInformationMessage('Kanban: Refresh Board (not yet implemented)');
  });

  context.subscriptions.push(openBoardCmd, initBoardCmd, addCardCmd, refreshBoardCmd);
}

export function deactivate(): void {
  // cleanup
}
