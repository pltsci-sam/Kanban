import * as vscode from 'vscode';
import { readBoard, BoardNotFoundError, initializeBoard, createCard, moveCard as coreMoveCard } from '@kanban/core';
import type { Board, Card, CardCreateInput } from '@kanban/core';
import { CardDetailPanel } from './views/card-detail-panel.js';

export interface BoardMessage {
  type: 'update' | 'moveCard' | 'openCard' | 'addCard' | 'refresh' | 'initBoard' | 'openBoardYaml';
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
      if (err instanceof BoardNotFoundError) {
        this.view.webview.postMessage({ type: 'empty' });
      } else {
        const message = err instanceof Error ? err.message : String(err);
        this.view.webview.postMessage({ type: 'error', payload: message });
      }
    }
  }

  private async handleMessage(message: BoardMessage): Promise<void> {
    switch (message.type) {
      case 'refresh':
        await this.refresh();
        break;
      case 'initBoard':
        await this.handleInitBoard();
        break;
      case 'openBoardYaml':
        await this.handleOpenBoardYaml();
        break;
      case 'openCard':
        if (this.boardDir && typeof message.payload === 'string') {
          CardDetailPanel.open(this.boardDir, message.payload, this.extensionUri);
        }
        break;
      case 'addCard':
        await this.handleAddCard(message.payload as { column: string; title: string; description?: string; priority?: string });
        break;
      case 'moveCard':
        await this.handleMoveCard(message.payload as { cardId: string; targetColumn: string; position?: number });
        break;
    }
  }

  private async handleInitBoard(): Promise<void> {
    if (!this.boardDir) return;
    try {
      await initializeBoard(this.boardDir);
      await this.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.view?.webview.postMessage({ type: 'error', payload: message });
    }
  }

  private async handleMoveCard(payload: { cardId: string; targetColumn: string; position?: number }): Promise<void> {
    if (!this.boardDir) return;
    try {
      const { join } = await import('node:path');
      const kanbanDir = join(this.boardDir, '.kanban');
      await coreMoveCard(kanbanDir, payload.cardId, payload.targetColumn, payload.position);
      await this.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.view?.webview.postMessage({ type: 'error', payload: message });
    }
  }

  private async handleAddCard(payload: { column: string; title: string; description?: string; priority?: string }): Promise<void> {
    if (!this.boardDir) return;
    try {
      const { join } = await import('node:path');
      const kanbanDir = join(this.boardDir, '.kanban');
      const input: CardCreateInput = {
        title: payload.title,
        column: payload.column,
        priority: (payload.priority || 'medium') as 'critical' | 'high' | 'medium' | 'low',
        description: payload.description || '',
        source: 'manual',
      };
      await createCard(kanbanDir, input);
      await this.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.view?.webview.postMessage({ type: 'error', payload: message });
    }
  }

  private async handleOpenBoardYaml(): Promise<void> {
    if (!this.boardDir) return;
    const { join } = await import('node:path');
    const boardYamlUri = vscode.Uri.file(join(this.boardDir, '.kanban', 'board.yaml'));
    await vscode.commands.executeCommand('vscode.open', boardYamlUri);
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
    .skeleton { display: flex; gap: 8px; min-height: 300px; }
    .skeleton-col { flex: 0 0 200px; background: var(--vscode-sideBar-background); border-radius: 4px; padding: 8px; }
    .skeleton-header { height: 16px; width: 80%; background: var(--vscode-panel-border); border-radius: 3px; margin-bottom: 12px; animation: shimmer 1.5s infinite; }
    .skeleton-card { height: 48px; background: var(--vscode-panel-border); border-radius: 3px; margin-bottom: 6px; opacity: 0.5; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 0.3; } }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 12px; }
    .empty-state-icon { font-size: 2.5em; opacity: 0.4; }
    .empty-state-text { opacity: 0.6; font-size: 0.95em; }
    .btn { padding: 6px 14px; border: none; border-radius: 3px; cursor: pointer; font-family: inherit; font-size: 0.85em; }
    .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
    .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; gap: 8px; }
    .error-state-icon { font-size: 2em; color: #e74c3c; }
    .error-state-msg { opacity: 0.8; font-size: 0.9em; text-align: center; max-width: 300px; }
    .warning-bar { background: rgba(230,126,34,0.15); color: #e67e22; padding: 4px 8px; margin-bottom: 8px; border-radius: 3px; font-size: 0.85em; display: flex; align-items: center; gap: 4px; }
    .column-header { display: flex; justify-content: space-between; align-items: center; }
    .add-card-btn { background: none; border: none; color: var(--vscode-foreground); opacity: 0.5; cursor: pointer; font-size: 1.1em; padding: 0 4px; line-height: 1; }
    .add-card-btn:hover { opacity: 1; }
    .card-form { background: var(--vscode-editor-background); border: 1px solid var(--vscode-focusBorder); border-radius: 3px; padding: 8px; margin-bottom: 6px; }
    .card-form input, .card-form textarea, .card-form select { width: 100%; box-sizing: border-box; font-family: inherit; font-size: 0.85em; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; padding: 4px 6px; margin-bottom: 4px; }
    .card-form textarea { resize: vertical; min-height: 48px; }
    .char-counter { font-size: 0.75em; text-align: right; opacity: 0.5; }
    .char-counter.warning { color: #e67e22; opacity: 1; }
    .char-counter.exceeded { color: #e74c3c; opacity: 1; }
    .form-error { color: #e74c3c; font-size: 0.8em; margin-bottom: 4px; }
    .form-actions { display: flex; gap: 4px; justify-content: flex-end; margin-top: 4px; }
    .form-label { font-size: 0.8em; opacity: 0.7; margin-bottom: 2px; }
    .card[draggable="true"] { cursor: grab; }
    .card.dragging { opacity: 0.4; }
    .column.drag-over { outline: 2px dashed var(--vscode-focusBorder); outline-offset: -2px; }
    .drop-indicator { height: 3px; background: var(--vscode-focusBorder); border-radius: 2px; margin: 2px 0; }
  </style>
</head>
<body>
  <div id="errors"></div>
  <div id="board" class="board">
    <div class="skeleton">
      <div class="skeleton-col"><div class="skeleton-header"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div>
      <div class="skeleton-col"><div class="skeleton-header"></div><div class="skeleton-card"></div></div>
      <div class="skeleton-col"><div class="skeleton-header"></div><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'update') renderBoard(msg.payload);
      if (msg.type === 'error') showError(msg.payload);
      if (msg.type === 'empty') showEmptyState();
    });

    function renderBoard(data) {
      const errEl = document.getElementById('errors');
      if (data.errors && data.errors.length > 0) {
        errEl.innerHTML = '<div class="warning-bar">\u26a0 ' + data.errors.length + ' card(s) skipped (malformed)</div>';
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
        html += '<div class="column-header"><span>' + escapeHtml(col.name) + wipText + '</span><button class="add-card-btn" data-add-column="' + escapeHtml(col.name) + '" title="Add card">+</button></div>';
        if (ids.length === 0) {
          html += '<div class="empty">No cards</div>';
        }
        for (const id of ids) {
          const card = cardsById[id];
          if (!card) continue;
          const isBlocked = card.blockers && card.blockers.length > 0;
          const blockedClass = isBlocked ? ' blocked' : '';
          html += '<div class="card' + blockedClass + '" data-id="' + card.id + '" draggable="true">';
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

      boardEl.querySelectorAll('.add-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          showCardForm(btn.dataset.addColumn, btn.closest('.column'));
        });
      });

      initDragDrop();
    }

    let currentBoardData = null;
    function showCardForm(columnName, columnEl) {
      if (columnEl.querySelector('.card-form')) return;
      const form = document.createElement('div');
      form.className = 'card-form';
      form.innerHTML =
        '<div class="form-label">Title</div>' +
        '<input type="text" id="cf-title" maxlength="200" placeholder="Card title...">' +
        '<div class="char-counter" id="cf-counter">0/200</div>' +
        '<div class="form-error" id="cf-error" style="display:none"></div>' +
        '<div class="form-label">Description</div>' +
        '<textarea id="cf-desc" placeholder="Optional description..."></textarea>' +
        '<div class="form-label">Priority</div>' +
        '<select id="cf-priority"><option value="medium">medium</option><option value="critical">critical</option><option value="high">high</option><option value="low">low</option></select>' +
        '<div class="form-actions">' +
        '<button class="btn btn-secondary" id="cf-cancel">Cancel</button>' +
        '<button class="btn btn-primary" id="cf-submit">Add Card</button>' +
        '</div>';
      columnEl.querySelector('.column-header').after(form);

      const titleInput = form.querySelector('#cf-title');
      const counter = form.querySelector('#cf-counter');
      titleInput.addEventListener('input', () => {
        const len = titleInput.value.length;
        counter.textContent = len + '/200';
        counter.className = 'char-counter' + (len >= 200 ? ' exceeded' : len >= 180 ? ' warning' : '');
      });

      form.querySelector('#cf-cancel').addEventListener('click', () => form.remove());
      form.querySelector('#cf-submit').addEventListener('click', () => {
        const title = titleInput.value.trim();
        if (!title) {
          const errEl = form.querySelector('#cf-error');
          errEl.textContent = 'Title is required';
          errEl.style.display = 'block';
          return;
        }
        vscode.postMessage({
          type: 'addCard',
          payload: {
            column: columnName,
            title: title,
            description: form.querySelector('#cf-desc').value.trim(),
            priority: form.querySelector('#cf-priority').value
          }
        });
        form.remove();
      });

      titleInput.focus();
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

    function initDragDrop() {
      const boardEl = document.getElementById('board');
      let draggedId = null;

      boardEl.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;
        draggedId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      boardEl.addEventListener('dragend', (e) => {
        const card = e.target.closest('.card');
        if (card) card.classList.remove('dragging');
        boardEl.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        boardEl.querySelectorAll('.drop-indicator').forEach(el => el.remove());
        draggedId = null;
      });

      boardEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const col = e.target.closest('.column');
        if (!col) return;
        boardEl.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        col.classList.add('drag-over');
      });

      boardEl.addEventListener('dragleave', (e) => {
        const col = e.target.closest('.column');
        if (col && !col.contains(e.relatedTarget)) {
          col.classList.remove('drag-over');
        }
      });

      boardEl.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedId) return;
        const col = e.target.closest('.column');
        if (!col) return;
        col.classList.remove('drag-over');
        const targetColumn = col.dataset.column;
        const cards = Array.from(col.querySelectorAll('.card'));
        let position = cards.length;
        for (let i = 0; i < cards.length; i++) {
          const rect = cards[i].getBoundingClientRect();
          if (e.clientY < rect.top + rect.height / 2) {
            position = i;
            break;
          }
        }
        vscode.postMessage({ type: 'moveCard', payload: { cardId: draggedId, targetColumn: targetColumn, position: position } });
      });
    }

    function showEmptyState() {
      document.getElementById('errors').innerHTML = '';
      document.getElementById('board').innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">\u{1F4CB}</div>' +
        '<div class="empty-state-text">No kanban board found in this workspace.</div>' +
        '<button class="btn btn-primary" onclick="vscode.postMessage({type:\'initBoard\'})">Initialize Board</button>' +
        '</div>';
    }

    function showError(msg) {
      document.getElementById('errors').innerHTML = '';
      document.getElementById('board').innerHTML =
        '<div class="error-state">' +
        '<div class="error-state-icon">\u26a0</div>' +
        '<div class="error-state-msg">' + escapeHtml(msg) + '</div>' +
        '<button class="btn btn-secondary" onclick="vscode.postMessage({type:\'openBoardYaml\'})">Open board.yaml in Editor</button>' +
        '</div>';
    }

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
  </script>
</body>
</html>`;
  }
}
