import { Gitlab } from '@gitbeaker/rest';
import { GeneratorService } from './generator.service';
import JSZip from 'jszip';

export interface GitLabExportOptions {
    token: string;
    host?: string; // Default: https://gitlab.com
    projectPath: string; // e.g., "username/repo" or group/subgroup/repo
    branch?: string; // Default: main
    commitMessage?: string;
}

export class GitLabService {
    private generatorService: GeneratorService;

    constructor() {
        this.generatorService = new GeneratorService();
    }

    async exportToGitLab(
        options: GitLabExportOptions,
        schemaContent: any,
        language: 'typescript' | 'python'
    ): Promise<string> {
        const {
            token,
            host = 'https://gitlab.com',
            projectPath,
            branch = 'main',
            commitMessage = 'Initial commit from Swagger2MCP',
        } = options;

        // Initialize GitLab client
        const gitlab = new Gitlab({
            token,
            host,
        });

        // Generate the code
        const zipBuffer = await this.generatorService.generate(schemaContent, language);
        const zip = await JSZip.loadAsync(zipBuffer);

        // Check if project exists, create if not
        let project: any;
        try {
            project = await gitlab.Projects.show(projectPath);
        } catch (e: any) {
            if (e.cause?.response?.status === 404 || e.message?.includes('404')) {
                // Project doesn't exist, create it
                const pathParts = projectPath.split('/');
                const projectName = pathParts[pathParts.length - 1];
                
                // Check if it's under a group/namespace
                if (pathParts.length > 1) {
                    const namespace = pathParts.slice(0, -1).join('/');
                    project = await gitlab.Projects.create({
                        name: projectName,
                        path: projectName,
                        namespaceId: await this.getNamespaceId(gitlab, namespace),
                        initializeWithReadme: false,
                    });
                } else {
                    // Personal project
                    project = await gitlab.Projects.create({
                        name: projectName,
                        path: projectName,
                        initializeWithReadme: false,
                    });
                }
            } else {
                throw e;
            }
        }

        const projectId = project.id;

        // Prepare commit actions (create/update files) using camelCase for @gitbeaker/rest
        const actions: Array<{
            action: 'create' | 'update';
            filePath: string;
            content: string;
        }> = [];

        // Get existing files to determine action type
        let existingFiles: Set<string> = new Set();
        try {
            const tree = await gitlab.Repositories.allRepositoryTrees(projectId, {
                ref: branch,
                recursive: true,
            });
            existingFiles = new Set(tree.map((item: any) => item.path));
        } catch (e) {
            // Branch might not exist yet, all files will be 'create'
        }

        // Iterate over zip files
        const files = Object.keys(zip.files);
        for (const filename of files) {
            if (zip.files[filename].dir) continue;
            const content = await zip.files[filename].async('string');
            
            actions.push({
                action: existingFiles.has(filename) ? 'update' : 'create',
                filePath: filename,
                content,
            });
        }

        // Create commit with all files
        try {
            await gitlab.Commits.create(projectId, branch, commitMessage, actions);
        } catch (e: any) {
            // If branch doesn't exist, create it from default branch or create initial commit
            if (e.message?.includes('branch') || e.cause?.response?.status === 400) {
                // Try to create the branch first
                try {
                    const defaultBranch = project.default_branch || 'main';
                    await gitlab.Branches.create(projectId, branch, defaultBranch);
                    await gitlab.Commits.create(projectId, branch, commitMessage, actions);
                } catch (branchError: any) {
                    // If no commits exist, we need to create initial commit differently
                    // Create files one by one for empty repo
                    for (const action of actions) {
                        await gitlab.RepositoryFiles.create(
                            projectId,
                            action.filePath,
                            branch,
                            action.content,
                            commitMessage
                        );
                    }
                }
            } else {
                throw e;
            }
        }

        // Return the project URL
        return `${host}/${projectPath}`;
    }

    private async getNamespaceId(gitlab: InstanceType<typeof Gitlab>, namespace: string): Promise<number> {
        try {
            // Try to find group first
            const groups = await gitlab.Groups.search(namespace);
            const exactMatch = groups.find((g: any) => g.full_path === namespace);
            if (exactMatch) {
                return exactMatch.id;
            }
        } catch (e) {
            // Group not found, might be user namespace
        }

        // If not found, try user namespace (for personal projects)
        try {
            const user = await gitlab.Users.showCurrentUser();
            if ((user as any).username === namespace) {
                return (user as any).id;
            }
        } catch (e) {
            // Ignore
        }

        throw new Error(`Namespace not found: ${namespace}`);
    }
}
