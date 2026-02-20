import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { ProjectConfig, ProjectsConfig } from '../models/projects.js';

export interface ProjectStatus {
  name: string;
  path: string;
  adapters: string[];
  enabled: boolean;
  cmsUrl: string | null;
  status: 'online' | 'offline';
}

export async function readProjectsYaml(projectsYamlPath: string): Promise<ProjectStatus[]> {
  const content = await readFile(projectsYamlPath, 'utf-8');
  const raw = yaml.load(content) as ProjectsConfig;

  if (!raw || !Array.isArray(raw.projects)) {
    throw new Error('Invalid projects.yaml: missing projects array');
  }

  const results: ProjectStatus[] = [];

  for (const project of raw.projects) {
    validateProjectPath(project.path);

    const isOnline = await isRepoAccessible(project.path);

    results.push({
      name: project.name,
      path: project.path,
      adapters: project.adapters || [],
      enabled: project.enabled !== false,
      cmsUrl: project.cmsUrl || null,
      status: isOnline ? 'online' : 'offline',
    });
  }

  return results;
}

function validateProjectPath(path: string): void {
  if (path.includes('..')) {
    throw new Error(`Invalid project path: '${path}' contains '..' sequences`);
  }
  if (!path.startsWith('/')) {
    throw new Error(`Invalid project path: '${path}' must be absolute`);
  }
}

async function isRepoAccessible(repoPath: string): Promise<boolean> {
  try {
    await access(join(repoPath, '.kanban', 'board.yaml'));
    return true;
  } catch {
    return false;
  }
}
