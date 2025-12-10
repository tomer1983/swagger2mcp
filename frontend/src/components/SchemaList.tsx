import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Download, Github, FileCode, GitlabIcon, Settings2, Edit, FileUp, Globe, Trash2, RefreshCw, CheckCircle2, XCircle, Loader2, Save, Network } from 'lucide-react';
import { getSchemas, generateServer, exportToGitHub, exportToGitLab, deleteSchema, validateGitHubConnection, validateGitLabConnection, getSavedRepositories, createSavedRepository, getRepositoryWithToken } from '../lib/api';
import type { GenerationOptions, SavedRepository } from '../lib/api';
import { GenerateModal } from './GenerateModal';
import { SchemaEditor } from './SchemaEditor';
import { Button } from './ui/button';
import { useToast } from './ui/toast';
import { ListSkeleton } from './ui/skeleton';

interface Schema {
    id: string;
    type: string;
    url?: string;
    createdAt: string;
    content: string;
}

type ExportTarget = 'github' | 'gitlab';

interface GenerateModalState {
    schemaId: string;
    schemaTitle: string;
}

interface EditorState {
    schemaId: string;
    schemaTitle: string;
    content: string;
}


interface Schema {
    id: string;
    type: string;
    url?: string;
    createdAt: string;
    content: string;
}

export const SchemaList = ({ refresh, onVisualize }: { refresh: number, onVisualize?: (schema: Schema) => void }) => {
    const [schemas, setSchemas] = useState<Schema[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<{ [key: string]: string }>({});
    const [showGenerateModal, setShowGenerateModal] = useState<GenerateModalState | null>(null);
    const [showEditor, setShowEditor] = useState<EditorState | null>(null);
    const [exportConfig, setExportConfig] = useState({
        // GitHub
        githubToken: '',
        owner: '',
        repo: '',
        // GitLab
        gitlabToken: '',
        projectPath: '',
        host: 'https://gitlab.com',
        branch: 'main',
    });
    const [showExportModal, setShowExportModal] = useState<{ schemaId: string; target: ExportTarget } | null>(null);
    const [exporting, setExporting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
    const [savedRepos, setSavedRepos] = useState<SavedRepository[]>([]);
    const [selectedRepoId, setSelectedRepoId] = useState<string>('');
    const [savingRepo, setSavingRepo] = useState(false);
    const [repoName, setRepoName] = useState('');
    const [repoDescription, setRepoDescription] = useState('');
    const toast = useToast();

    // AutoAnimate for smooth list transitions
    const [listRef] = useAutoAnimate<HTMLDivElement>();

    useEffect(() => {
        loadSchemas();
    }, [refresh]);

    const loadSchemas = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSchemas();
            setSchemas(data);
        } catch (error: any) {
            console.error('Failed to load schemas:', error);
            setError(error.response?.data?.error || 'Failed to load schemas');
            toast.error('Failed to Load Schemas', 'Could not retrieve schemas from the server');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (schemaId: string, options?: GenerationOptions) => {
        const language = options?.language || selectedLanguage[schemaId] || 'typescript';
        try {
            toast.info('Generating Server', 'This may take a few moments...');
            const blob = await generateServer(schemaId, language, options);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mcp-server-${schemaId}.zip`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Server Generated', 'Download started successfully');
        } catch (error: any) {
            console.error('Generation failed:', error);
            toast.error('Generation Failed', error.response?.data?.error || 'Check console for details');
        }
    };

    const handleQuickGenerate = async (schemaId: string) => {
        const language = selectedLanguage[schemaId] || 'typescript';
        try {
            toast.info('Generating Server', 'Preparing your download...');
            const blob = await generateServer(schemaId, language);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mcp-server-${schemaId}.zip`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Download Started', 'Your MCP server is ready');
        } catch (error: any) {
            console.error('Generation failed:', error);
            toast.error('Generation Failed', error.response?.data?.error || 'Check console for details');
        }
    };

    const handleExport = async (schemaId: string) => {
        if (!showExportModal) return;

        const language = selectedLanguage[schemaId] || 'typescript';
        setExporting(true);

        try {
            if (showExportModal.target === 'github') {
                await exportToGitHub(
                    schemaId,
                    language,
                    exportConfig.githubToken,
                    exportConfig.owner,
                    exportConfig.repo
                );
                toast.success('Exported to GitHub', `Repository: ${exportConfig.owner}/${exportConfig.repo}`);
            } else {
                await exportToGitLab({
                    schemaId,
                    language,
                    gitlabToken: exportConfig.gitlabToken,
                    projectPath: exportConfig.projectPath,
                    host: exportConfig.host,
                    branch: exportConfig.branch,
                });
                toast.success('Exported to GitLab', `Project: ${exportConfig.projectPath}`);
            }
            setShowExportModal(null);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message;
            toast.error('Export Failed', errorMsg);
        } finally {
            setExporting(false);
        }
    };

    const handleValidateConnection = async () => {
        if (!showExportModal) return;

        setValidating(true);
        setValidationResult(null);

        try {
            let result;
            if (showExportModal.target === 'github') {
                result = await validateGitHubConnection(
                    exportConfig.githubToken,
                    exportConfig.owner,
                    exportConfig.repo
                );
            } else {
                result = await validateGitLabConnection(
                    exportConfig.gitlabToken,
                    exportConfig.host,
                    exportConfig.projectPath
                );
            }
            setValidationResult(result);
            if (result.valid) {
                toast.success('Connection Valid', result.message);
            } else {
                toast.error('Connection Failed', result.message);
            }
        } catch (error: any) {
            setValidationResult({ valid: false, message: error.message });
            toast.error('Validation Error', error.message);
        } finally {
            setValidating(false);
        }
    };

    // Load saved repositories when export modal opens
    const loadSavedRepos = async (type: 'github' | 'gitlab') => {
        try {
            const repos = await getSavedRepositories(type);
            setSavedRepos(repos);
        } catch (error) {
            console.error('Failed to load saved repositories:', error);
            setSavedRepos([]);
        }
    };

    // Handle selecting a saved repository
    const handleSelectSavedRepo = async (repoId: string) => {
        setSelectedRepoId(repoId);
        if (!repoId) return;

        try {
            const repo = await getRepositoryWithToken(repoId);
            if (repo.type === 'github') {
                setExportConfig(prev => ({
                    ...prev,
                    githubToken: repo.token,
                    owner: repo.owner || '',
                    repo: repo.repo || '',
                }));
            } else {
                setExportConfig(prev => ({
                    ...prev,
                    gitlabToken: repo.token,
                    projectPath: repo.projectPath || '',
                    host: repo.host || 'https://gitlab.com',
                    branch: repo.branch || 'main',
                }));
            }
            setValidationResult(null);
            toast.success('Configuration Loaded', `Loaded "${repo.name}" settings`);
        } catch (error: any) {
            toast.error('Load Failed', error.message || 'Failed to load repository');
        }
    };

    // Save current config as a new saved repository
    const handleSaveRepo = async () => {
        if (!showExportModal || !repoName.trim()) {
            toast.error('Name Required', 'Please enter a name for this configuration');
            return;
        }

        setSavingRepo(true);
        try {
            const type = showExportModal.target;
            await createSavedRepository({
                type,
                name: repoName.trim(),
                description: repoDescription.trim() || undefined,
                ...(type === 'github' ? {
                    owner: exportConfig.owner,
                    repo: exportConfig.repo,
                    token: exportConfig.githubToken,
                } : {
                    projectPath: exportConfig.projectPath,
                    host: exportConfig.host,
                    branch: exportConfig.branch,
                    token: exportConfig.gitlabToken,
                }),
            });
            toast.success('Saved!', `Configuration "${repoName}" saved successfully`);
            setRepoName('');
            setRepoDescription('');
            loadSavedRepos(type);
        } catch (error: any) {
            toast.error('Save Failed', error.message || 'Failed to save configuration');
        } finally {
            setSavingRepo(false);
        }
    };

    // Load repos when modal opens
    useEffect(() => {
        if (showExportModal) {
            loadSavedRepos(showExportModal.target);
            setSelectedRepoId('');
            setValidationResult(null);
        }
    }, [showExportModal]);

    const handleDelete = async (schemaId: string) => {
        if (!confirm('Are you sure you want to delete this schema?')) return;

        try {
            await deleteSchema(schemaId);
            toast.success('Schema Deleted', 'The schema has been removed successfully');
            loadSchemas();
        } catch (error: any) {
            console.error('Delete failed:', error);
            toast.error('Delete Failed', error.response?.data?.error || 'Could not delete schema');
        }
    };

    // ESC key handler for modals
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (showExportModal && !exporting) {
                setShowExportModal(null);
            }
        }
    }, [showExportModal, exporting]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (loading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground mb-4">Your Schemas</h2>
                <ListSkeleton count={3} />
            </div>
        );
    }

    // Error state with retry
    if (error && schemas.length === 0) {
        return (
            <div className="text-center py-20 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 mb-6">
                    <FileCode className="h-10 w-10 text-destructive/60" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Failed to load schemas
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                    {error}
                </p>
                <Button
                    onClick={loadSchemas}
                    variant="primary"
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Try Again
                </Button>
            </div>
        );
    }

    if (schemas.length === 0) {
        return (
            <div className="text-center py-20 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 mb-6">
                    <FileCode className="h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    No schemas yet
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                    Get started by uploading an OpenAPI schema file or crawling a URL that serves OpenAPI documentation.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <button
                        onClick={() => {
                            const uploadTab = document.querySelector('[data-tab="upload"]') as HTMLElement;
                            uploadTab?.click();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/20"
                    >
                        <FileUp className="h-4 w-4" aria-hidden="true" />
                        Upload Schema
                    </button>
                    <button
                        onClick={() => {
                            const crawlTab = document.querySelector('[data-tab="crawl"]') as HTMLElement;
                            crawlTab?.click();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-xl transition-all duration-200 backdrop-blur-sm"
                    >
                        <Globe className="h-4 w-4" aria-hidden="true" />
                        Crawl URL
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Your Schemas</h2>
                <Button
                    onClick={loadSchemas}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Refresh
                </Button>
            </div>
            <div ref={listRef} className="space-y-4">
                {schemas.map((schema) => {
                    const spec = JSON.parse(schema.content);
                    return (
                        <div key={schema.id} className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2.5 group-hover:text-primary transition-colors duration-200">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <FileCode className="h-4 w-4" aria-hidden="true" />
                                        </div>
                                        {spec.info?.title || 'Untitled API'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground/80 mt-1.5 flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary/50 text-secondary-foreground/80">
                                            {schema.type}
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(schema.createdAt).toLocaleString()}</span>
                                    </p>
                                    {schema.url && (
                                        <p className="text-xs text-primary/70 mt-2 break-all hover:text-primary transition-colors">{schema.url}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                {/* Generate actions group */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <select
                                        value={selectedLanguage[schema.id] || 'typescript'}
                                        onChange={(e) => setSelectedLanguage({ ...selectedLanguage, [schema.id]: e.target.value })}
                                        className="bg-input/50 border border-border/50 text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all duration-200 hover:bg-input/70"
                                        aria-label="Select programming language"
                                    >
                                        <option value="typescript">TypeScript</option>
                                        <option value="python">Python</option>
                                    </select>

                                    <Button
                                        onClick={() => handleQuickGenerate(schema.id)}
                                        variant="primary"
                                        size="sm"
                                        className="whitespace-nowrap"
                                    >
                                        <Download className="h-4 w-4" aria-hidden="true" />
                                        Download
                                    </Button>

                                    {/* Visualize Button */}
                                    <Button
                                        onClick={() => onVisualize?.(schema)}
                                        variant="secondary"
                                        size="sm"
                                        className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
                                        aria-label="Visualize Schema"
                                    >
                                        <Network className="h-4 w-4" aria-hidden="true" />
                                        Visualize
                                    </Button>

                                    <Button
                                        onClick={() => setShowGenerateModal({
                                            schemaId: schema.id,
                                            schemaTitle: spec.info?.title || 'Untitled API'
                                        })}
                                        variant="secondary"
                                        size="sm"
                                        className="whitespace-nowrap bg-purple-600 hover:bg-purple-700"
                                        aria-label="Configure generation options"
                                    >
                                        <Settings2 className="h-4 w-4" aria-hidden="true" />
                                        Configure
                                    </Button>

                                    <Button
                                        onClick={() => setShowEditor({
                                            schemaId: schema.id,
                                            schemaTitle: spec.info?.title || 'Untitled API',
                                            content: schema.content,
                                        })}
                                        variant="secondary"
                                        size="sm"
                                        className="whitespace-nowrap"
                                        aria-label="Edit schema in editor"
                                    >
                                        <Edit className="h-4 w-4" aria-hidden="true" />
                                        Edit
                                    </Button>

                                    <Button
                                        onClick={() => handleDelete(schema.id)}
                                        variant="secondary"
                                        size="sm"
                                        className="whitespace-nowrap text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-900/30"
                                        aria-label="Delete schema"
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                        Delete
                                    </Button>
                                </div>

                                <div className="w-px h-6 bg-slate-600 hidden sm:block" aria-hidden="true" />

                                {/* Export actions group */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                        onClick={() => setShowExportModal({ schemaId: schema.id, target: 'github' })}
                                        variant="secondary"
                                        size="sm"
                                        className="whitespace-nowrap"
                                    >
                                        <Github className="h-4 w-4" aria-hidden="true" />
                                        GitHub
                                    </Button>

                                    <Button
                                        onClick={() => setShowExportModal({ schemaId: schema.id, target: 'gitlab' })}
                                        variant="secondary"
                                        size="sm"
                                        className="whitespace-nowrap bg-orange-600 hover:bg-orange-700"
                                    >
                                        <GitlabIcon className="h-4 w-4" aria-hidden="true" />
                                        GitLab
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Schema Editor Side Panel - rendered via portal */}
            {showEditor && createPortal(
                <SchemaEditor
                    schemaId={showEditor.schemaId}
                    schemaTitle={showEditor.schemaTitle}
                    initialContent={JSON.stringify(JSON.parse(showEditor.content), null, 2)}
                    onClose={() => setShowEditor(null)}
                    onSave={() => {
                        loadSchemas();
                    }}
                />,
                document.body
            )}

            {showExportModal && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !exporting) {
                            setShowExportModal(null);
                        }
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="export-modal-title"
                >
                    <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 id="export-modal-title" className="text-xl font-bold text-popover-foreground mb-5 flex items-center gap-3">
                            {showExportModal.target === 'github' ? (
                                <>
                                    <div className="p-2 rounded-lg bg-secondary/80">
                                        <Github className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    Export to GitHub
                                </>
                            ) : (
                                <>
                                    <div className="p-2 rounded-lg bg-orange-500/10">
                                        <GitlabIcon className="h-5 w-5 text-orange-500" aria-hidden="true" />
                                    </div>
                                    Export to GitLab
                                </>
                            )}
                        </h3>
                        <div className="space-y-4">
                            {/* Saved Repositories Dropdown */}
                            {savedRepos.length > 0 && (
                                <div>
                                    <label htmlFor="saved-repo" className="block text-sm font-medium text-muted-foreground mb-1">
                                        Load Saved Configuration
                                    </label>
                                    <select
                                        id="saved-repo"
                                        value={selectedRepoId}
                                        onChange={(e) => handleSelectSavedRepo(e.target.value)}
                                        className="w-full px-4 py-2 bg-input border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">-- Select saved configuration --</option>
                                        {savedRepos.map(repo => (
                                            <option key={repo.id} value={repo.id}>
                                                {repo.name}{repo.description ? ` - ${repo.description}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {showExportModal.target === 'github' ? (
                                <>
                                    <div>
                                        <label htmlFor="github-token" className="block text-sm font-medium text-muted-foreground mb-1">
                                            GitHub Personal Access Token
                                        </label>
                                        <input
                                            id="github-token"
                                            type="password"
                                            placeholder="ghp_xxxxxxxxxxxx"
                                            value={exportConfig.githubToken}
                                            onChange={(e) => setExportConfig({ ...exportConfig, githubToken: e.target.value })}
                                            className="w-full px-4 py-2 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="github-owner" className="block text-sm font-medium text-muted-foreground mb-1">
                                            Owner (username or organization)
                                        </label>
                                        <input
                                            id="github-owner"
                                            type="text"
                                            placeholder="octocat"
                                            value={exportConfig.owner}
                                            onChange={(e) => setExportConfig({ ...exportConfig, owner: e.target.value })}
                                            className="w-full px-4 py-2 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="github-repo" className="block text-sm font-medium text-muted-foreground mb-1">
                                            Repository Name
                                        </label>
                                        <input
                                            id="github-repo"
                                            type="text"
                                            placeholder="my-mcp-server"
                                            value={exportConfig.repo}
                                            onChange={(e) => setExportConfig({ ...exportConfig, repo: e.target.value })}
                                            className="w-full px-4 py-2 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>

                                    {/* Validation Result */}
                                    {validationResult && (
                                        <div className={`flex items-center gap-2 p-3 rounded-lg ${validationResult.valid ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                                            {validationResult.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            <span className="text-sm">{validationResult.message}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="gitlab-token" className="block text-sm font-medium text-muted-foreground mb-1">
                                            GitLab Personal Access Token
                                        </label>
                                        <input
                                            id="gitlab-token"
                                            type="password"
                                            placeholder="glpat-xxxxxxxxxxxx"
                                            value={exportConfig.gitlabToken}
                                            onChange={(e) => setExportConfig({ ...exportConfig, gitlabToken: e.target.value })}
                                            className="w-full px-4 py-2 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="gitlab-host" className="block text-sm font-medium text-muted-foreground mb-1">
                                            GitLab Host
                                        </label>
                                        <input
                                            id="gitlab-host"
                                            type="text"
                                            placeholder="https://gitlab.com"
                                            value={exportConfig.host}
                                            onChange={(e) => setExportConfig({ ...exportConfig, host: e.target.value })}
                                            className="w-full px-4 py-2 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="gitlab-project" className="block text-sm font-medium text-muted-foreground mb-1">
                                            Project Path
                                        </label>
                                        <input
                                            id="gitlab-project"
                                            type="text"
                                            placeholder="username/my-project"
                                            value={exportConfig.projectPath}
                                            onChange={(e) => setExportConfig({ ...exportConfig, projectPath: e.target.value })}
                                            className="w-full px-4 py-2 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="gitlab-branch" className="block text-sm font-medium text-muted-foreground mb-1">
                                            Branch
                                        </label>
                                        <input
                                            id="gitlab-branch"
                                            type="text"
                                            placeholder="main"
                                            value={exportConfig.branch}
                                            onChange={(e) => setExportConfig({ ...exportConfig, branch: e.target.value })}
                                            className="w-full px-4 py-2 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>

                                    {/* Validation Result */}
                                    {validationResult && (
                                        <div className={`flex items-center gap-2 p-3 rounded-lg ${validationResult.valid ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                                            {validationResult.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            <span className="text-sm">{validationResult.message}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={handleValidateConnection}
                                    disabled={validating || exporting}
                                    variant="outline"
                                    size="md"
                                >
                                    {validating ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Testing...</>
                                    ) : (
                                        'Test Connection'
                                    )}
                                </Button>
                                <Button
                                    onClick={() => handleExport(showExportModal.schemaId)}
                                    disabled={exporting}
                                    loading={exporting}
                                    variant={showExportModal.target === 'github' ? 'primary' : 'secondary'}
                                    className={showExportModal.target === 'gitlab' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                    size="md"
                                >
                                    {exporting ? 'Exporting...' : 'Export'}
                                </Button>
                                <Button
                                    onClick={() => setShowExportModal(null)}
                                    disabled={exporting}
                                    variant="secondary"
                                    size="md"
                                >
                                    Cancel
                                </Button>
                            </div>

                            {/* Save Configuration Section */}
                            <div className="border-t border-border pt-4 mt-4">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Save This Configuration</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Configuration name"
                                        value={repoName}
                                        onChange={(e) => setRepoName(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-input border border-border rounded text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    <Button
                                        onClick={handleSaveRepo}
                                        disabled={savingRepo || !repoName.trim()}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {savingRepo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Modal - rendered via portal */}
            {showGenerateModal && createPortal(
                <GenerateModal
                    schemaId={showGenerateModal.schemaId}
                    schemaTitle={showGenerateModal.schemaTitle}
                    onGenerate={handleGenerate}
                    onClose={() => setShowGenerateModal(null)}
                />,
                document.body
            )}
        </div>
    );
};
