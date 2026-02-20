import * as vscode from 'vscode';
import { readCard, updateCard, appendNote } from '@kanban/core';
import type { Card, Note, Blocker } from '@kanban/core';

export class CardDetailPanel {
  public static readonly viewType = 'kanban.cardDetail';
  private static panels = new Map<string, CardDetailPanel>();

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly boardDir: string,
    private readonly cardId: string,
  ) {
    this.panel.onDidDispose(() => {
      CardDetailPanel.panels.delete(this.cardId);
    });

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'unblock') {
        await this.handleUnblock(msg.blockerId, msg.response);
      }
    });
  }

  static async open(
    boardDir: string,
    cardId: string,
    extensionUri: vscode.Uri,
  ): Promise<void> {
    const existing = CardDetailPanel.panels.get(cardId);
    if (existing) {
      existing.panel.reveal();
      return;
    }

    const card = await readCard(boardDir, cardId);
    if (!card) {
      vscode.window.showErrorMessage(`Card ${cardId} not found.`);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      CardDetailPanel.viewType,
      `[${card.id}] ${card.title}`,
      vscode.ViewColumn.One,
      { enableScripts: true, localResourceRoots: [extensionUri] },
    );

    const instance = new CardDetailPanel(panel, boardDir, cardId);
    CardDetailPanel.panels.set(cardId, instance);
    panel.webview.html = instance.getHtml(card);
  }

  private getHtml(card: Card): string {
    const fields = this.renderFields(card);
    const description = this.escapeHtml(card.description || 'No description.');
    const notes = this.renderNotes(card.notes || []);
    const blockers = this.renderBlockers(card.blockers || []);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(card.title)}</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 16px; }
    h1 { font-size: 1.3em; margin: 0 0 12px 0; }
    .fields { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin-bottom: 16px; font-size: 0.9em; }
    .field-label { opacity: 0.6; font-weight: bold; }
    .field-value { }
    .priority-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 0.85em; font-weight: bold; }
    .priority-badge.critical { background: rgba(231,76,60,0.2); color: #e74c3c; }
    .priority-badge.high { background: rgba(230,126,34,0.2); color: #e67e22; }
    .priority-badge.medium { background: rgba(52,152,219,0.2); color: #3498db; }
    .priority-badge.low { background: rgba(149,165,166,0.2); color: #95a5a6; }
    .label-tag { display: inline-block; font-size: 0.8em; padding: 1px 5px; border-radius: 2px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); margin-right: 3px; }
    .section-title { font-size: 1em; font-weight: bold; margin: 16px 0 8px 0; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 4px; }
    .description { white-space: pre-wrap; font-size: 0.9em; line-height: 1.5; }
    .notes { margin-top: 8px; }
    .note { border-left: 3px solid var(--vscode-panel-border); padding: 6px 10px; margin-bottom: 8px; font-size: 0.85em; }
    .note-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; opacity: 0.7; font-size: 0.9em; }
    .note-type { display: inline-block; padding: 1px 5px; border-radius: 2px; font-size: 0.8em; font-weight: bold; }
    .note-type.comment { background: rgba(52,152,219,0.2); color: #3498db; }
    .note-type.status { background: rgba(46,204,113,0.2); color: #2ecc71; }
    .note-type.blocker { background: rgba(231,76,60,0.2); color: #e74c3c; }
    .note-type.review { background: rgba(155,89,182,0.2); color: #9b59b6; }
    .note-content { white-space: pre-wrap; line-height: 1.4; }
    .blockers { margin-bottom: 16px; }
    .blocker-item { background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3); border-radius: 4px; padding: 10px; margin-bottom: 8px; }
    .blocker-question { font-size: 0.9em; margin-bottom: 8px; }
    .blocker-question-icon { color: #e74c3c; margin-right: 4px; }
    .blocker-response { width: 100%; box-sizing: border-box; min-height: 60px; resize: vertical; font-family: inherit; font-size: 0.85em; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; padding: 6px; margin-bottom: 6px; }
    .blocker-hint { font-size: 0.75em; opacity: 0.5; font-style: italic; margin-bottom: 6px; }
    .unblock-btn { padding: 5px 12px; border: none; border-radius: 3px; cursor: pointer; font-family: inherit; font-size: 0.85em; background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .unblock-btn:hover { background: var(--vscode-button-hoverBackground); }
    .unblock-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(card.title)}</h1>
  <div class="fields">${fields}</div>${blockers}
  <div class="section-title">Description</div>
  <div class="description">${description}</div>
  <div class="section-title">Notes</div>
  <div class="notes">${notes}</div>
  <script>
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('.blocker-response').forEach(ta => {
      const btn = ta.parentElement.querySelector('.unblock-btn');
      ta.addEventListener('input', () => { btn.disabled = ta.value.trim().length === 0; });
    });
    document.querySelectorAll('.unblock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const blockerId = btn.dataset.blocker;
        const ta = btn.parentElement.querySelector('.blocker-response');
        vscode.postMessage({ type: 'unblock', blockerId: blockerId, response: ta.value.trim() });
      });
    });
  </script>
</body>
</html>`;
  }

  private async handleUnblock(blockerId: string, response: string): Promise<void> {
    try {
      const { join } = await import('node:path');
      const kanbanDir = join(this.boardDir, '.kanban');
      const card = await readCard(kanbanDir, this.cardId);
      if (!card) return;

      const updatedBlockers = (card.blockers || []).filter(b => b.id !== blockerId);
      await updateCard(kanbanDir, this.cardId, { blockers: updatedBlockers });
      await appendNote(kanbanDir, this.cardId, {
        author: 'user',
        type: 'unblock',
        content: `Unblocked ${blockerId}: ${response}`,
      });

      // Reload the card detail
      const refreshed = await readCard(kanbanDir, this.cardId);
      if (refreshed) {
        this.panel.webview.html = this.getHtml(refreshed);
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to unblock: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private renderBlockers(blockers: Blocker[]): string {
    if (blockers.length === 0) return '';

    const items = blockers.map(b => {
      return `<div class="blocker-item">
        <div class="blocker-question"><span class="blocker-question-icon">\u26a0</span>${this.escapeHtml(b.question)}</div>
        <div class="blocker-hint">Enter your response to unblock this card</div>
        <textarea class="blocker-response" data-blocker="${this.escapeHtml(b.id)}" placeholder="Your response..."></textarea>
        <button class="unblock-btn" data-blocker="${this.escapeHtml(b.id)}" disabled>Unblock</button>
      </div>`;
    }).join('\n');

    return `
  <div class="section-title">Blockers (${blockers.length})</div>
  <div class="blockers">${items}</div>`;
  }

  private renderFields(card: Card): string {
    const rows: string[] = [];
    const add = (label: string, value: string) => {
      rows.push(`<div class="field-label">${label}</div><div class="field-value">${value}</div>`);
    };

    add('ID', card.id);
    add('Column', this.escapeHtml(card.column));
    add('Priority', `<span class="priority-badge ${card.priority}">${card.priority}</span>`);

    if (card.labels && card.labels.length > 0) {
      const tags = card.labels.map(l => `<span class="label-tag">${this.escapeHtml(l)}</span>`).join('');
      add('Labels', tags);
    }

    if (card.assignee) add('Assignee', this.escapeHtml(card.assignee));
    if (card.source) add('Source', this.escapeHtml(card.source));
    add('Created', card.created);
    add('Updated', card.updated);
    if (card.due) add('Due', card.due);

    return rows.join('\n');
  }

  private renderNotes(notes: Note[]): string {
    if (notes.length === 0) {
      return '<div style="opacity:0.4;font-style:italic;font-size:0.9em;">No notes.</div>';
    }

    return notes
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(note => {
        const typeClass = note.type || 'comment';
        return `<div class="note">
          <div class="note-header">
            <span class="note-type ${typeClass}">${this.escapeHtml(note.type || 'comment')}</span>
            <span>${this.escapeHtml(note.author)}</span>
            <span>${note.timestamp}</span>
          </div>
          <div class="note-content">${this.escapeHtml(note.content)}</div>
        </div>`;
      })
      .join('\n');
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
