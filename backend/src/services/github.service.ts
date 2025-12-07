import { Octokit } from 'octokit';
import { GeneratorService } from './generator.service';
import JSZip from 'jszip';

export class GitHubService {
    private generatorService: GeneratorService;

    constructor() {
        this.generatorService = new GeneratorService();
    }

    async exportToGitHub(token: string, owner: string, repo: string, schemaContent: any, language: 'typescript' | 'python') {
        const octokit = new Octokit({ auth: token });

        // Generate the code (we need the files, not zip, but generator returns zip)
        // We can refactor generator to return files map, or unzip the buffer.
        // For now, let's refactor generator slightly or just unzip here.
        const zipBuffer = await this.generatorService.generate(schemaContent, language);
        const zip = await JSZip.loadAsync(zipBuffer);

        // Create repo if not exists
        try {
            await octokit.rest.repos.get({ owner, repo });
        } catch (e: any) {
            if (e.status === 404) {
                await octokit.rest.repos.createForAuthenticatedUser({ name: repo });
            } else {
                throw e;
            }
        }

        // Get default branch (usually main or master)
        let defaultBranch = 'main';
        try {
            const repoData = await octokit.rest.repos.get({ owner, repo });
            defaultBranch = repoData.data.default_branch;
        } catch (e) {
            // If repo is empty, we can push to 'main'
        }

        // Create a tree
        const tree: any[] = [];

        // Iterate over zip files
        const files = Object.keys(zip.files);
        for (const filename of files) {
            if (zip.files[filename].dir) continue;
            const content = await zip.files[filename].async('string');

            // We need to create blobs for files? Or just use createOrUpdateFileContents for each?
            // Creating a tree is more atomic but complex.
            // Let's use simple file creation for now, or tree if many files.
            // Tree is better.

            tree.push({
                path: filename,
                mode: '100644',
                type: 'blob',
                content: content
            });
        }

        // Get latest commit SHA
        let latestCommitSha;
        try {
            const ref = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
            latestCommitSha = ref.data.object.sha;
        } catch (e) {
            // Repo might be empty
        }

        // Create Tree
        const { data: treeData } = await octokit.rest.git.createTree({
            owner,
            repo,
            base_tree: latestCommitSha,
            tree
        });

        // Create Commit
        const { data: commitData } = await octokit.rest.git.createCommit({
            owner,
            repo,
            message: 'Initial commit from Swagger2MCP',
            tree: treeData.sha,
            parents: latestCommitSha ? [latestCommitSha] : []
        });

        // Update Ref
        await octokit.rest.git.updateRef({
            owner,
            repo,
            ref: `heads/${defaultBranch}`,
            sha: commitData.sha,
            force: true // Be careful with force
        });

        return `https://github.com/${owner}/${repo}`;
    }
}
