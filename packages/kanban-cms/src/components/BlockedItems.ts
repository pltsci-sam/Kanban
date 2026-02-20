import type { BlockedCard, CompletionEntry } from '../lib/event-handlers.js';

export function renderBlockedItems(blocked: BlockedCard[]): string {
  if (blocked.length === 0) {
    return '<div class="blocked-section"><h2>Blocked</h2><div class="none">No blocked items</div></div>';
  }

  const items = blocked.map(b => `<div class="blocked-item">
    <div class="blocked-card-title">[${escapeHtml(b.cardId)}] ${escapeHtml(b.title)}</div>
    <div class="blocked-question">${escapeHtml(b.blockerQuestion)}</div>
    <div class="blocked-meta">${escapeHtml(b.column)} &bull; ${escapeHtml(b.blockedSince)}</div>
  </div>`).join('');

  return `<div class="blocked-section">
    <h2>Blocked (${blocked.length})</h2>
    ${items}
  </div>`;
}

export function renderRecentCompletions(completions: CompletionEntry[]): string {
  const recent = completions.slice(-10);

  if (recent.length === 0) {
    return '<div class="completions-section"><h2>Recent Completions</h2><div class="none">No recent completions</div></div>';
  }

  const items = recent.map(c => `<div class="completion-item">
    <span class="completion-check">\u2713</span>
    <span class="completion-title">[${escapeHtml(c.cardId)}] ${escapeHtml(c.title)}</span>
    <span class="completion-meta">${escapeHtml(c.completedBy)} &bull; ${escapeHtml(c.completedAt)}</span>
  </div>`).join('');

  return `<div class="completions-section">
    <h2>Recent Completions</h2>
    ${items}
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
