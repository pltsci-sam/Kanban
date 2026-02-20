import type { AgentInfo } from '../lib/event-handlers.js';

export function renderAgentPanel(agent: AgentInfo): string {
  const statusColor = agent.status === 'active' ? '#2ecc71' : agent.status === 'idle' ? '#f39c12' : '#95a5a6';
  const statusDot = `<span class="status-dot" style="background:${statusColor}"></span>`;

  return `<div class="agent-panel" data-agent-id="${agent.id}">
    <div class="agent-header">
      ${statusDot}
      <span class="agent-name">${escapeHtml(agent.name)}</span>
      <span class="agent-status">${agent.status}</span>
    </div>
    ${agent.currentCard ? `<div class="agent-card">Working on: ${escapeHtml(agent.currentCard)}</div>` : ''}
    <div class="agent-started">Since: ${escapeHtml(agent.startedAt)}</div>
  </div>`;
}

export function renderAgentPanels(agents: AgentInfo[]): string {
  if (agents.length === 0) {
    return '<div class="no-agents">No active agents</div>';
  }
  return `<div class="agent-panels">
    <h2>Agents (${agents.length})</h2>
    ${agents.map(renderAgentPanel).join('\n')}
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
