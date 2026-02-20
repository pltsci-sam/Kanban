export interface ProjectStatus {
    name: string;
    path: string;
    adapters: string[];
    enabled: boolean;
    cmsUrl: string | null;
    status: 'online' | 'offline';
}
export declare function readProjectsYaml(projectsYamlPath: string): Promise<ProjectStatus[]>;
//# sourceMappingURL=projects-reader.d.ts.map