import type { AdapterType } from './enrichment.js';

export interface ProjectConfig {
  name: string;
  path: string;
  description?: string;
  adapters: AdapterType[];
  enabled: boolean;
  cmsUrl?: string;
}

export interface ProjectsConfig {
  projects: ProjectConfig[];
}
