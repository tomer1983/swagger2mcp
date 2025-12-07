import { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { X, Save, History, RotateCcw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { updateSchema, getSchemaVersions, revertSchema } from '../lib/api';
import { Button } from './ui/button';

interface SchemaVersion {
    version: number;
    content: string;
    changelog: string;
    createdAt: string;
    isCurrent: boolean;
}

interface SchemaEditorProps {
    schemaId: string;
    schemaTitle: string;
    initialContent: string;
    onClose: () => void;
    onSave?: () => void;
}

export function SchemaEditor({ schemaId, schemaTitle, initialContent, onClose, onSave }: SchemaEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [changelog, setChangelog] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [versions, setVersions] = useState<SchemaVersion[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isFullWidth, setIsFullWidth] = useState(false);

    // Reset content when schemaId changes
    useEffect(() => {
        setContent(initialContent);
        setHasChanges(false);
        setChangelog('');
        setError(null);
        setShowHistory(false);
        setVersions([]);
    }, [schemaId, initialContent]);

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving && !hasChanges) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [saving, hasChanges, onClose]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        if (value !== undefined) {
            setContent(value);
            setHasChanges(value !== initialContent);
        }
    }, [initialContent]);

    const handleSave = async () => {
        if (!hasChanges) return;

        setSaving(true);
        setError(null);

        try {
            // Validate JSON
            JSON.parse(content);
            
            await updateSchema(schemaId, content, changelog || 'Updated via editor');
            setHasChanges(false);
            setChangelog('');
            onSave?.();
        } catch (e: any) {
            if (e.message.includes('JSON')) {
                setError('Invalid JSON: Please fix syntax errors before saving');
            } else {
                setError(e.response?.data?.error || e.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const loadVersions = async () => {
        if (versions.length > 0) {
            setShowHistory(!showHistory);
            return;
        }

        setLoadingVersions(true);
        try {
            const data = await getSchemaVersions(schemaId);
            setVersions(data);
            setShowHistory(true);
        } catch (e: any) {
            setError('Failed to load version history');
        } finally {
            setLoadingVersions(false);
        }
    };

    const handleRevert = async (version: number) => {
        if (!confirm(`Revert to version ${version}? Current changes will be saved as a new version.`)) {
            return;
        }

        try {
            await revertSchema(schemaId, version);
            // Reload content
            const data = await getSchemaVersions(schemaId);
            const current = data.find((v: SchemaVersion) => v.isCurrent);
            if (current) {
                setContent(current.content);
                setHasChanges(false);
            }
            setVersions(data);
            onSave?.();
        } catch (e: any) {
            setError('Failed to revert: ' + (e.response?.data?.error || e.message));
        }
    };

    const formatContent = () => {
        try {
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            setContent(formatted);
            setHasChanges(formatted !== initialContent);
        } catch (e) {
            setError('Cannot format: Invalid JSON');
        }
    };

    // Collapsed state - just show a narrow strip with expand button
    if (isCollapsed) {
        return (
            <div className="fixed top-0 right-0 h-full w-12 bg-slate-900 border-l border-slate-700 z-50 flex flex-col items-center py-4 shadow-2xl">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="Expand editor"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="mt-4 writing-mode-vertical text-slate-400 text-sm font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    {schemaTitle}
                </div>
                {hasChanges && (
                    <div className="mt-2 w-2 h-2 rounded-full bg-yellow-500" title="Unsaved changes" />
                )}
            </div>
        );
    }

    return (
        <div 
            className={`fixed top-0 right-0 h-full bg-slate-900 border-l border-slate-700 z-50 flex flex-col shadow-2xl transition-all duration-300 ${
                isFullWidth ? 'w-full' : 'w-[55%] min-w-[500px] max-w-[900px]'
            }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/80 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors shrink-0"
                        title="Collapse panel"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-white truncate">Edit Schema</h2>
                        <span className="text-slate-400 text-xs truncate block">{schemaTitle}</span>
                    </div>
                    {hasChanges && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded shrink-0">
                            Unsaved
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={formatContent}
                        className="px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 rounded transition-colors"
                        aria-label="Format JSON content"
                    >
                        Format
                    </button>
                    <button
                        onClick={loadVersions}
                        disabled={loadingVersions}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 rounded transition-colors"
                        aria-label="Show version history"
                        aria-expanded={showHistory}
                    >
                        <History className="h-3 w-3" aria-hidden="true" />
                        {loadingVersions ? '...' : 'History'}
                        {showHistory ? <ChevronUp className="h-2.5 w-2.5" aria-hidden="true" /> : <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" />}
                    </button>
                    <button
                        onClick={() => setIsFullWidth(!isFullWidth)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title={isFullWidth ? 'Half width' : 'Full width'}
                        aria-label={isFullWidth ? 'Switch to half width' : 'Switch to full width'}
                    >
                        {isFullWidth ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title="Close editor"
                        aria-label="Close schema editor"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Version History Panel */}
            {showHistory && versions.length > 0 && (
                <div className="border-b border-slate-700 bg-slate-800/50 p-2 max-h-32 overflow-y-auto shrink-0">
                    <div className="text-xs text-slate-400 mb-1.5">Version History</div>
                    <div className="space-y-1">
                        {versions.map((v) => (
                            <div 
                                key={v.version}
                                className="flex items-center justify-between p-1.5 bg-slate-800 rounded text-xs"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`font-mono shrink-0 ${v.isCurrent ? 'text-green-400' : 'text-slate-300'}`}>
                                        v{v.version}
                                    </span>
                                    <span className="text-slate-400 truncate">{v.changelog}</span>
                                    <span className="text-slate-500 text-[10px] shrink-0">
                                        {new Date(v.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {!v.isCurrent && (
                                    <button
                                        onClick={() => handleRevert(v.version)}
                                        className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-blue-400 hover:bg-slate-700 rounded shrink-0"
                                    >
                                        <RotateCcw className="h-2.5 w-2.5" />
                                        Revert
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="p-2 bg-red-500/10 border-b border-red-500/30 text-red-400 text-xs shrink-0">
                    {error}
                </div>
            )}

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={content}
                    onChange={handleEditorChange}
                    options={{
                        minimap: { enabled: true, scale: 1 },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        formatOnPaste: true,
                    }}
                />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t border-slate-700 bg-slate-800/80 shrink-0">
                <input
                    type="text"
                    placeholder="Changelog message (optional)"
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    className="flex-1 max-w-xs px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Changelog message"
                />
                <div className="flex items-center gap-2">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        size="sm"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        loading={saving}
                        variant="primary"
                        size="sm"
                    >
                        <Save className="h-3 w-3" aria-hidden="true" />
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
