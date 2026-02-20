import type { ThinkingEvent } from '../lib/sse-client.js';

const MAX_LINES = 50;

export function renderThinkingStream(agentName: string, events: ThinkingEvent[]): string {
  const recent = events.slice(-MAX_LINES);
  const lines = recent.map(e =>
    `<div class="thinking-line"><span class="thinking-time">${escapeHtml(e.timestamp)}</span> ${escapeHtml(e.text)}</div>`,
  ).join('');

  return `<div class="thinking-stream" data-agent="${escapeHtml(agentName)}">
    <div class="thinking-header">${escapeHtml(agentName)} thinking</div>
    <div class="thinking-content">${lines || '<div class="thinking-empty">Waiting for output...</div>'}</div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
