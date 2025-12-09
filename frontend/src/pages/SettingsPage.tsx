import { useState, useEffect, useMemo } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Github, GitlabIcon, Trash2, Edit, Save, Loader2, Plus, Search, Filter } from 'lucide-react';
import { getSavedRepositories, deleteSavedRepository, updateSavedRepository, createSavedRepository } from '../lib/api';
import type { SavedRepository, CreateRepositoryData } from '../lib/api';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

export const SettingsPage = () => {
    const [repos, setRepos] = useState<SavedRepository[]>([]);
    const [loading, setLoading] = useState(true);
    const [parent] = useAutoAnimate();
    const toast = useToast();

    // Filter & Search State
    const [typeFilter, setTypeFilter] = useState<'all' | 'github' | 'gitlab'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Edit Token State
    const [editingRepoId, setEditingRepoId] = useState<string | null>(null);
    const [newToken, setNewToken] = useState('');
    const [updating, setUpdating] = useState(false);

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [repoToDelete, setRepoToDelete] = useState<SavedRepository | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Create Repo State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newRepo, setNewRepo] = useState<Partial<CreateRepositoryData>>({
        type: 'github',
        name: '',
        description: '',
        token: '',
        owner: '',
        repo: '',
        host: 'https://gitlab.com',
        projectPath: '',
        branch: 'main'
    });

    const loadRepos = async () => {
        try {
            setLoading(true);
            const data = await getSavedRepositories();
            setRepos(data);
        } catch (error) {
            console.error('Failed to load repositories', error);
            toast.error('Error', 'Failed to load saved repositories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRepos();
    }, []);

    // Filtered repos based on type and search
    const filteredRepos = useMemo(() => {
        return repos.filter(repo => {
            // Type filter
            if (typeFilter !== 'all' && repo.type !== typeFilter) {
                return false;
            }
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const searchableText = [
                    repo.name,
                    repo.description,
                    repo.owner,
                    repo.repo,
                    repo.projectPath,
                    repo.host
                ].filter(Boolean).join(' ').toLowerCase();

                if (!searchableText.includes(query)) {
                    return false;
                }
            }
            return true;
        });
    }, [repos, typeFilter, searchQuery]);

    const openDeleteDialog = (repo: SavedRepository) => {
        setRepoToDelete(repo);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!repoToDelete) return;

        try {
            setDeleting(true);
            await deleteSavedRepository(repoToDelete.id);
            setRepos(repos.filter(r => r.id !== repoToDelete.id));
            toast.success('Deleted', 'Repository configuration removed');
            setDeleteDialogOpen(false);
            setRepoToDelete(null);
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Error', 'Failed to delete configuration');
        } finally {
            setDeleting(false);
        }
    };

    const handleUpdateToken = async (id: string) => {
        if (!newToken.trim()) return;

        try {
            setUpdating(true);
            await updateSavedRepository(id, { token: newToken } as any);
            toast.success('Updated', 'Token updated successfully');
            setEditingRepoId(null);
            setNewToken('');
        } catch (error) {
            console.error('Update failed', error);
            toast.error('Error', 'Failed to update token');
        } finally {
            setUpdating(false);
        }
    };

    const validateHostUrl = (url: string): boolean => {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch {
            return false;
        }
    };

    const handleCreate = async () => {
        if (!newRepo.name || !newRepo.token || !newRepo.type) {
            toast.error('Validation', 'Name, Type, and Token are required');
            return;
        }

        if (newRepo.type === 'github' && (!newRepo.owner || !newRepo.repo)) {
            toast.error('Validation', 'Owner and Repository are required for GitHub');
            return;
        }

        if (newRepo.type === 'gitlab') {
            if (!newRepo.projectPath) {
                toast.error('Validation', 'Project Path is required for GitLab');
                return;
            }
            if (newRepo.host && !validateHostUrl(newRepo.host)) {
                toast.error('Validation', 'Host must be a valid URL (http:// or https://)');
                return;
            }
        }

        try {
            setCreating(true);
            const created = await createSavedRepository(newRepo as CreateRepositoryData);
            setRepos([created, ...repos]);
            toast.success('Success', 'Repository configuration saved');
            setIsCreateOpen(false);
            setNewRepo({
                type: 'github',
                name: '',
                description: '',
                token: '',
                owner: '',
                repo: '',
                host: 'https://gitlab.com',
                projectPath: '',
                branch: 'main'
            });
        } catch (error: any) {
            console.error('Create failed', error);
            if (error.response?.status === 409) {
                toast.error('Duplicate Name', 'A configuration with this name already exists.');
            } else {
                toast.error('Error', error.response?.data?.error || 'Failed to save configuration');
            }
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-6xl px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Settings
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your saved repository configurations and connections.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Connection
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Connection</DialogTitle>
                            <DialogDescription>
                                Save a new repository configuration for quick access.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">
                                    Type
                                </Label>
                                <Select
                                    value={newRepo.type}
                                    onValueChange={(value: 'github' | 'gitlab') => setNewRepo({ ...newRepo, type: value })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="github">GitHub</SelectItem>
                                        <SelectItem value="gitlab">GitLab</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newRepo.name}
                                    onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="e.g. Work Repo"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Input
                                    id="description"
                                    value={newRepo.description}
                                    onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="token" className="text-right">
                                    Token
                                </Label>
                                <Input
                                    id="token"
                                    type="password"
                                    value={newRepo.token}
                                    onChange={(e) => setNewRepo({ ...newRepo, token: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Personal Access Token"
                                />
                            </div>

                            {newRepo.type === 'github' ? (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="owner" className="text-right">
                                            Owner
                                        </Label>
                                        <Input
                                            id="owner"
                                            value={newRepo.owner}
                                            onChange={(e) => setNewRepo({ ...newRepo, owner: e.target.value })}
                                            className="col-span-3"
                                            placeholder="Username or Org"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="repo" className="text-right">
                                            Repository
                                        </Label>
                                        <Input
                                            id="repo"
                                            value={newRepo.repo}
                                            onChange={(e) => setNewRepo({ ...newRepo, repo: e.target.value })}
                                            className="col-span-3"
                                            placeholder="Repository Name"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="host" className="text-right">
                                            Host
                                        </Label>
                                        <Input
                                            id="host"
                                            value={newRepo.host}
                                            onChange={(e) => setNewRepo({ ...newRepo, host: e.target.value })}
                                            className="col-span-3"
                                            placeholder="https://gitlab.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="project" className="text-right">
                                            Project Path
                                        </Label>
                                        <Input
                                            id="project"
                                            value={newRepo.projectPath}
                                            onChange={(e) => setNewRepo({ ...newRepo, projectPath: e.target.value })}
                                            className="col-span-3"
                                            placeholder="group/project"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="branch" className="text-right">
                                            Branch
                                        </Label>
                                        <Input
                                            id="branch"
                                            value={newRepo.branch}
                                            onChange={(e) => setNewRepo({ ...newRepo, branch: e.target.value })}
                                            className="col-span-3"
                                            placeholder="main"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={creating}>
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Connection'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            Saved Connections
                            <span className="text-sm font-normal text-muted-foreground ml-2">({filteredRepos.length})</span>
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Type Filter */}
                            <Select
                                value={typeFilter}
                                onValueChange={(value: 'all' | 'github' | 'gitlab') => setTypeFilter(value)}
                            >
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="github">GitHub</SelectItem>
                                    <SelectItem value="gitlab">GitLab</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search repositories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full sm:w-[200px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        Loading configurations...
                    </div>
                ) : filteredRepos.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <p>No saved configurations found.</p>
                        <p className="text-sm mt-2">
                            {repos.length > 0
                                ? 'Try adjusting your filters or search query.'
                                : 'Add a new connection or generate a server and export it to save.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/50 text-left text-sm font-medium text-muted-foreground">
                                    <th className="px-6 py-4">Configuration</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Target</th>
                                    <th className="px-6 py-4">Last Updated</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody ref={parent} className="divide-y divide-border/50">
                                {filteredRepos.map((repo) => (
                                    <tr key={repo.id} className="group hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${repo.type === 'github' ? 'bg-secondary' : 'bg-orange-500/10'}`}>
                                                    {repo.type === 'github' ? (
                                                        <Github className="h-5 w-5" />
                                                    ) : (
                                                        <GitlabIcon className="h-5 w-5 text-orange-600" />
                                                    )}
                                                </div>
                                                <div className="font-medium text-foreground">{repo.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                                            {repo.description || <span className="text-muted-foreground/50 italic">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                                            {repo.type === 'github' ? (
                                                <span>{repo.owner}/{repo.repo}</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span>{repo.host}</span>
                                                    <span className="text-xs opacity-70">{repo.projectPath}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {repo.createdAt && new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(repo.createdAt))}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {editingRepoId === repo.id ? (
                                                <div className="flex items-center justify-end gap-2 animate-in slide-in-from-right-5 fade-in duration-200">
                                                    <input
                                                        type="password"
                                                        placeholder="New Token"
                                                        value={newToken}
                                                        onChange={(e) => setNewToken(e.target.value)}
                                                        className="px-3 py-1.5 text-sm bg-input border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring w-32"
                                                        autoFocus
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        disabled={updating || !newToken}
                                                        onClick={() => handleUpdateToken(repo.id)}
                                                    >
                                                        {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingRepoId(null);
                                                            setNewToken('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setEditingRepoId(repo.id)}
                                                        title="Replace Token"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Token
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => openDeleteDialog(repo)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Delete Connection</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{repoToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
