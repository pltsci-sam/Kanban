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
    .card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 3px; padding: 6px 8px; margin-bottom: 4px; cursor: pointer; font-size: 0.9em; }
    .card:hover { border-color: var(--vscode-focusBorder); }
    .card-id { opacity: 0.5; font-size: 0.8em; }
    .card-priority { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; }
    .card-priority.critical { background: #e74c3c; }
    .card-priority.high { background: #e67e22; }
    .card-priority.medium { background: #3498db; }
    .card-priority.low { background: #95a5a6; }
    .card-labels { display: flex; gap: 2px; margin-top: 4px; flex-wrap: wrap; }
    .label { font-size: 0.7em; padding: 1px 4px; border-radius: 2px; opacity: 0.8; }
    .blocked { border-left: 3px solid #e74c3c; }
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

      let html = '';
      for (const col of columns) {
        const ids = cardOrder[col.name] || [];
        const wipText = col.wipLimit ? ' <span class="wip">(' + ids.length + '/' + col.wipLimit + ')</span>' : '';
        html += '<div class="column" data-column="' + col.name + '">';
        html += '<div class="column-header">' + col.name + wipText + '</div>';
        if (ids.length === 0) {
          html += '<div class="empty">No cards</div>';
        }
        for (const id of ids) {
          const card = cardsById[id];
          if (!card) continue;
          const blockedClass = card.blockers && card.blockers.length > 0 ? ' blocked' : '';
          html += '<div class="card' + blockedClass + '" data-id="' + card.id + '">';
          html += '<span class="card-priority ' + card.priority + '"></span>';
          html += '<span class="card-id">[' + card.id + ']</span> ' + escapeHtml(card.title);
          if (card.labels && card.labels.length > 0) {
            html += '<div class="card-labels">';
            for (const l of card.labels) {
              html += '<span class="label">' + escapeHtml(l) + '</span>';
            }
            html += '</div>';
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
