import type { DashboardState } from '../lib/event-handlers.js';

const SDLC_COLUMNS = [
  'Backlog', 'Spec Creation', 'Spec Review', 'Building', 'Testing', 'Human Review', 'Done',
];

export function renderPipelineOverview(state: DashboardState): string {
  const total = Object.values(state.pipeline).reduce((a, b) => a + b, 0);

  const columns = SDLC_COLUMNS.map(col => {
    const count = state.pipeline[col] || 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `<div class="pipeline-col">
      <div class="pipeline-bar-container">
        <div class="pipeline-bar" style="height:${pct}%"></div>
      </div>
      <div class="pipeline-count">${count}</div>
      <div class="pipeline-label">${col}</div>
    </div>`;
  }).join('');

  return `<div class="pipeline-overview">
    <h2>Pipeline</h2>
    <div class="pipeline-chart">${columns}</div>
  </div>`;
}
