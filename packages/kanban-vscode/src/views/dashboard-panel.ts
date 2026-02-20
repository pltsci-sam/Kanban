import * as vscode from 'vscode';
import { readBoard } from '@kanban/core';
import { readProjectsYaml } from '@kanban/core/dist/services/projects-reader.js';
import type { ProjectStatus } from '@kanban/core/dist/services/projects-reader.js';

interface DashboardProject extends ProjectStatus {
  totalCards: number;
  doneCards: number;
  completionPct: number;
  lastActivity: string;
  phase: string;
}

export class DashboardPanel {
  public static readonly viewType = 'kanban.dashboard';
  private static instance?: DashboardPanel;

  private constructor(private readonly panel: vscode.WebviewPanel) {
    this.panel.onDidDispose(() => {
      DashboardPanel.instance = undefined;
    });
  }

  static async open(projectsYamlPath: string): Promise<void> {
    if (DashboardPanel.instance) {
      DashboardPanel.instance.panel.reveal();
      await DashboardPanel.instance.refresh(projectsYamlPath);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      DashboardPanel.viewType,
      'Kanban Dashboard',
      vscode.ViewColumn.One,
      { enableScripts: false },
    );

    DashboardPanel.instance = new DashboardPanel(panel);
    await DashboardPanel.instance.refresh(projectsYamlPath);
  }

  private async refresh(projectsYamlPath: string): Promise<void> {
    try {
      const projects = await readProjectsYaml(projectsYamlPath);
      const dashProjects = await Promise.all(
        projects.filter(p => p.enabled).map(p => this.enrichProject(p)),
      );
      this.panel.webview.html = this.getHtml(dashProjects);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.panel.webview.html = this.getErrorHtml(msg);
    }
  }

  private async enrichProject(project: ProjectStatus): Promise<DashboardProject> {
    if (project.status === 'offline') {
      return { ...project, totalCards: 0, doneCards: 0, completionPct: 0, lastActivity: 'N/A', phase: 'offline' };
    }

    try {
      const state = await readBoard(project.path);
      const doneCol = state.board.columns.find(c => c.name.toLowerCase() === 'done');
      const doneCards = doneCol ? (state.board.cardOrder[doneCol.name] || []).length : 0;
      const totalCards = state.cards.length;
      const completionPct = totalCards > 0 ? Math.round((doneCards / totalCards) * 100) : 0;

      const updates = state.cards.map(c => c.updated).filter(Boolean).sort();
      const lastActivity = updates.length > 0 ? updates[updates.length - 1] : 'N/A';

      const activeCol = state.board.columns.find(c => {
        const ids = state.board.cardOrder[c.name] || [];
        return ids.length > 0 && c.name.toLowerCase() !== 'done' && c.name.toLowerCase() !== 'backlog';
      });
      const phase = activeCol?.name || 'Idle';

      return { ...project, totalCards, doneCards, completionPct, lastActivity, phase };
    } catch {
      return { ...project, totalCards: 0, doneCards: 0, completionPct: 0, lastActivity: 'N/A', phase: 'error' };
    }
  }

  private getHtml(projects: DashboardProject[]): string {
    const cards = projects.map(p => {
      const barColor = p.status === 'offline' ? '#95a5a6' : p.completionPct >= 80 ? '#2ecc71' : p.completionPct >= 40 ? '#3498db' : '#e67e22';
      const statusLabel = p.status === 'offline' ? '<span style="color:#95a5a6">offline</span>' : this.esc(p.phase);

      return `<div class="project-card">
        <div class="project-name">${this.esc(p.name)}</div>
        <div class="project-phase">${statusLabel}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${p.completionPct}%;background:${barColor}"></div></div>
        <div class="project-stats">${p.completionPct}% complete (${p.doneCards}/${p.totalCards})</div>
        <div class="project-activity">Last: ${this.esc(p.lastActivity)}</div>
      </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Dashboard</title>
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 16px; }
  h1 { font-size: 1.3em; margin: 0 0 16px 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .project-card { background: var(--vscode-sideBar-background); border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; }
  .project-name { font-weight: bold; font-size: 1.05em; margin-bottom: 4px; }
  .project-phase { font-size: 0.85em; opacity: 0.7; margin-bottom: 8px; }
  .progress-bar { height: 6px; background: var(--vscode-panel-border); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
  .progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
  .project-stats { font-size: 0.85em; }
  .project-activity { font-size: 0.75em; opacity: 0.5; margin-top: 4px; }
</style></head><body>
  <h1>Kanban Dashboard</h1>
  <div class="grid">${cards}</div>
</body></html>`;
  }

  private getErrorHtml(msg: string): string {
    return `<!DOCTYPE html><html><body style="font-family:var(--vscode-font-family);color:var(--vscode-foreground);padding:16px">
      <h2>Dashboard Error</h2><p>${this.esc(msg)}</p></body></html>`;
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
