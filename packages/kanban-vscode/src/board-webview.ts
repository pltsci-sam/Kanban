import * as vscode from 'vscode';
import { readBoard } from '@kanban/core';
import type { Board, Card } from '@kanban/core';

export interface BoardMessage {
  type: 'update' | 'moveCard' | 'openCard' | 'addCard' | 'refresh';
  payload?: unknown;
}

export interface BoardUpdate {
  board: Board;
  cards: Card[];
  errors: { cardId: string; message: string }[];
}

export class BoardWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kanban.boardView';
  private view?: vscode.WebviewView;
  private boardDir?: string;

  constructor(private readonly extensionUri: vscode.Uri) {}

  setBoardDir(boardDir: string): void {
    this.boardDir = boardDir;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.onDidReceiveMessage((message: BoardMessage) => {
      this.handleMessage(message);
    });

    webviewView.webview.html = this.getHtml();
    this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.view || !this.boardDir) return;

    try {
      const state = await readBoard(this.boardDir);
      const update: BoardUpdate = {
        board: state.board,
        cards: state.cards,
        errors: state.errors,
      };
      this.view.webview.postMessage({ type: 'update', payload: update });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.view.webview.postMessage({ type: 'error', payload: message });
    }
  }

  private handleMessage(message: BoardMessage): void {
    switch (message.type) {
      case 'refresh':
        this.refresh();
        break;
      case 'moveCard':
      case 'openCard':
      case 'addCard':
        // Handled by P5 features
        break;
    }
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kanban Board</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 8px; }
    .board { display: flex; gap: 8px; overflow-x: auto; min-height: 300px; }
    .column { flex: 0 0 200px; background: var(--vscode-sideBar-background); border-radius: 4px; padding: 8px; }
    .column-header { font-weight: bold; margin-bottom: 8px; padding: 4px; border-bottom: 1px solid var(--vscode-panel-border); }
    .column-header .wip { font-weight: normal; opacity: 0.6; font-size: 0.85em; }
    .column-header .wip-exceeded { color: #e74c3c; font-weight: bold; opacity: 1; }
    .card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 3px; padding: 6px 8px; margin-bottom: 4px; cursor: pointer; font-size: 0.9em; }
    .card:hover { border-color: var(--vscode-focusBorder); }
    .card-id { opacity: 0.5; font-size: 0.8em; }
    .card-title-row { display: flex; align-items: center; gap: 4px; }
    .card-priority-badge { display: inline-flex; align-items: center; gap: 2px; font-size: 0.75em; padding: 1px 4px; border-radius: 2px; font-weight: bold; }
    .card-priority-badge.critical { background: rgba(231,76,60,0.2); color: #e74c3c; }
    .card-priority-badge.high { background: rgba(230,126,34,0.2); color: #e67e22; }
    .card-priority-badge.medium { background: rgba(52,152,219,0.2); color: #3498db; }
    .card-priority-badge.low { background: rgba(149,165,166,0.2); color: #95a5a6; }
    .card-priority-icon { font-size: 0.9em; }
    .card-labels { display: flex; gap: 2px; margin-top: 4px; flex-wrap: wrap; }
    .label { font-size: 0.7em; padding: 1px 4px; border-radius: 2px; opacity: 0.8; display: inline-flex; align-items: center; gap: 2px; }
    .label-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--vscode-foreground); opacity: 0.6; display: inline-block; }
    .blocked { border-left: 3px solid #e74c3c; animation: pulse-border 2s ease-in-out infinite; }
    @keyframes pulse-border { 0%,100% { border-left-color: #e74c3c; } 50% { border-left-color: #c0392b; } }
    .blocked-indicator { display: flex; align-items: center; gap: 3px; color: #e74c3c; font-size: 0.75em; margin-top: 3px; }
    .enrichment { font-size: 0.7em; opacity: 0.7; margin-top: 3px; display: flex; gap: 6px; }
    .enrichment-item { display: inline-flex; align-items: center; gap: 2px; }
    .empty { text-align: center; opacity: 0.4; padding: 16px; font-style: italic; }
    .error-bar { background: var(--vscode-inputValidation-errorBackground); padding: 4px 8px; margin-bottom: 8px; border-radius: 3px; font-size: 0.85em; }
  </style>
</head>
<body>
  <div id="errors"></div>
  <div id="board" class="board"><div class="empty">Loading board...</div></div>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'update') renderBoard(msg.payload);
      if (msg.type === 'error') showError(msg.payload);
    });

    function renderBoard(data) {
      const errEl = document.getElementById('errors');
      if (data.errors && data.errors.length > 0) {
        errEl.innerHTML = '<div class="error-bar">' + data.errors.length + ' card(s) failed to parse</div>';
      } else {
        errEl.innerHTML = '';
      }

      const boardEl = document.getElementById('board');
      const columns = data.board.columns;
      const cardOrder = data.board.cardOrder || {};
      const cardsById = {};
      (data.cards || []).forEach(c => { cardsById[c.id] = c; });

      const priorityIcons = { critical: '\u26a0', high: '\u2191', medium: '\u2022', low: '\u2193' };

      let html = '';
      for (const col of columns) {
        const ids = cardOrder[col.name] || [];
        const wipExceeded = col.wipLimit && ids.length > col.wipLimit;
        const wipClass = wipExceeded ? ' wip-exceeded' : '';
        const wipIcon = wipExceeded ? '\u26a0 ' : '';
        const wipText = col.wipLimit ? ' <span class="wip' + wipClass + '">' + wipIcon + '(' + ids.length + '/' + col.wipLimit + ')</span>' : '';
        html += '<div class="column" data-column="' + escapeHtml(col.name) + '">';
        html += '<div class="column-header">' + escapeHtml(col.name) + wipText + '</div>';
        if (ids.length === 0) {
          html += '<div class="empty">No cards</div>';
        }
        for (const id of ids) {
          const card = cardsById[id];
          if (!card) continue;
          const isBlocked = card.blockers && card.blockers.length > 0;
          const blockedClass = isBlocked ? ' blocked' : '';
          html += '<div class="card' + blockedClass + '" data-id="' + card.id + '">';
          html += '<div class="card-title-row">';
          const pIcon = priorityIcons[card.priority] || '\u2022';
          html += '<span class="card-priority-badge ' + card.priority + '"><span class="card-priority-icon">' + pIcon + '</span>' + card.priority + '</span>';
          html += '<span class="card-id">[' + card.id + ']</span>';
          html += '</div>';
          html += '<div>' + escapeHtml(card.title) + '</div>';
          if (isBlocked) {
            html += '<div class="blocked-indicator">\u26a0 Blocked (' + card.blockers.length + ')</div>';
          }
          if (card.labels && card.labels.length > 0) {
            html += '<div class="card-labels">';
            for (const l of card.labels) {
              html += '<span class="label"><span class="label-dot"></span>' + escapeHtml(l) + '</span>';
            }
            html += '</div>';
          }
          if (card.enrichment) {
            html += renderEnrichment(card.enrichment);
          }
          html += '</div>';
        }
        html += '</div>';
      }
      boardEl.innerHTML = html;

      boardEl.querySelectorAll('.card').forEach(el => {
        el.addEventListener('click', () => {
          vscode.postMessage({ type: 'openCard', payload: el.dataset.id });
        });
      });
    }

    function renderEnrichment(e) {
      let parts = [];
      if (e.ralph && e.ralph.buildProgress != null) {
        parts.push('<span class="enrichment-item">\u2692 ' + e.ralph.buildProgress + '%</span>');
      }
      if (e.specops && e.specops.specStatus) {
        parts.push('<span class="enrichment-item">\u2699 ' + escapeHtml(e.specops.specStatus) + '</span>');
      }
      if (e.specArtifact && e.specArtifact.openQuestions > 0) {
        parts.push('<span class="enrichment-item">\u2753 ' + e.specArtifact.openQuestions + ' questions</span>');
      }
      if (parts.length === 0) return '';
      return '<div class="enrichment">' + parts.join('') + '</div>';
    }

    function showError(msg) {
      document.getElementById('errors').innerHTML = '<div class="error-bar">' + escapeHtml(msg) + '</div>';
    }

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
  </script>
</body>
</html>`;
  }
}
