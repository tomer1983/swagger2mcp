import { useState } from 'react';
import { Download, Settings2, FileCode, FileText, Box, Workflow, TestTube } from 'lucide-react';
import type { GenerationOptions } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Tooltip } from './ui/tooltip';

// Extended options for the modal state (all required for the form)
interface ModalOptions {
    language: 'typescript' | 'python';
    serverName: string;
    asyncMode: boolean;
    strictTypes: boolean;
    includeComments: boolean;
    generateTests: boolean;
    includeDockerfile: boolean;
    includeCIConfig: 'none' | 'github' | 'gitlab' | 'both';
    routePrefix: string;
    authType: 'none' | 'bearer' | 'api-key' | 'basic';
    includeTestUI: boolean;
}

interface GenerateModalProps {
    schemaId: string;
    schemaTitle: string;
    onGenerate: (schemaId: string, options: GenerationOptions) => Promise<void>;
    onClose: () => void;
}

const defaultOptions: ModalOptions = {
    language: 'typescript',
    serverName: '',
    asyncMode: true,
    strictTypes: true,
    includeComments: true,
    generateTests: false,
    includeDockerfile: false,
    includeCIConfig: 'none',
    routePrefix: '',
    authType: 'bearer',
    includeTestUI: false,
};

export const GenerateModal = ({ schemaId, schemaTitle, onGenerate, onClose }: GenerateModalProps) => {
    const [options, setOptions] = useState<ModalOptions>({
        ...defaultOptions,
        serverName: schemaTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
    });
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await onGenerate(schemaId, options);
            onClose();
        } catch (error) {
            console.error('Generation failed:', error);
        } finally {
            setGenerating(false);
        }
    };

    const updateOption = <K extends keyof ModalOptions>(key: K, value: ModalOptions[K]) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const resetToDefaults = () => {
        setOptions({ ...defaultOptions, serverName: options.serverName });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && !generating && onClose()}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <Settings2 className="h-6 w-6 text-primary" aria-hidden="true" />
                        <div>
                            <DialogTitle className="text-xl">Generate MCP Server</DialogTitle>
                            <DialogDescription>{schemaTitle}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Content - Two Column Layout */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Language & Naming */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FileCode className="h-5 w-5 text-primary" />
                                    Language & Naming
                                </h3>
                                <div className="space-y-4 pl-7">
                                    <div>
                                        <Label className="mb-2 block">Language</Label>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => updateOption('language', 'typescript')}
                                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                                    options.language === 'typescript'
                                                        ? 'border-primary bg-primary/10 text-foreground'
                                                        : 'border-border bg-muted text-muted-foreground hover:border-muted-foreground'
                                                }`}
                                            >
                                                <div className="font-medium">TypeScript</div>
                                                <div className="text-xs text-muted-foreground mt-1">MCP SDK + Axios</div>
                                            </button>
                                            <button
                                                onClick={() => updateOption('language', 'python')}
                                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                                    options.language === 'python'
                                                        ? 'border-primary bg-primary/10 text-foreground'
                                                        : 'border-border bg-muted text-muted-foreground hover:border-muted-foreground'
                                                }`}
                                            >
                                                <div className="font-medium">Python</div>
                                                <div className="text-xs text-muted-foreground mt-1">MCP + HTTPX</div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="server-name">Server Name</Label>
                                        <Input
                                            id="server-name"
                                            value={options.serverName}
                                            onChange={(e) => updateOption('serverName', e.target.value)}
                                            placeholder="my-mcp-server"
                                        />
                                        <p className="text-xs text-muted-foreground">Used in package.json and as the server identifier</p>
                                    </div>
                                </div>
                            </section>

                            {/* Code Style */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-purple-500" />
                                    Code Style
                                </h3>
                                <div className="space-y-3 pl-7">
                                    <Tooltip content="Use async/await syntax for HTTP calls">
                                        <ToggleOption
                                            label="Async/Await Mode"
                                            description="Use async/await syntax for HTTP calls"
                                            checked={options.asyncMode}
                                            onChange={(v) => updateOption('asyncMode', v)}
                                        />
                                    </Tooltip>
                                    <Tooltip content={options.language === 'typescript' ? 'Enable strict TypeScript mode' : 'Add type hints to Python code'}>
                                        <ToggleOption
                                            label="Strict Types"
                                            description={options.language === 'typescript' ? 'Enable strict TypeScript mode' : 'Add type hints to Python code'}
                                            checked={options.strictTypes}
                                            onChange={(v) => updateOption('strictTypes', v)}
                                        />
                                    </Tooltip>
                                    <Tooltip content="Add JSDoc/docstring comments from OpenAPI descriptions">
                                        <ToggleOption
                                            label="Include Comments"
                                            description="Add JSDoc/docstring comments from OpenAPI descriptions"
                                            checked={options.includeComments}
                                            onChange={(v) => updateOption('includeComments', v)}
                                        />
                                    </Tooltip>
                                </div>
                            </section>

                            {/* API Configuration */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Workflow className="h-5 w-5 text-green-500" />
                                    API Configuration
                                </h3>
                                <div className="space-y-4 pl-7">
                                    <div className="space-y-2">
                                        <Label htmlFor="route-prefix">Route Prefix</Label>
                                        <Input
                                            id="route-prefix"
                                            value={options.routePrefix}
                                            onChange={(e) => updateOption('routePrefix', e.target.value)}
                                            placeholder="/api/v1"
                                        />
                                        <p className="text-xs text-muted-foreground">Prefix added to all API paths</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="auth-type">Authentication Type</Label>
                                        <Select
                                            value={options.authType}
                                            onValueChange={(v) => updateOption('authType', v as ModalOptions['authType'])}
                                        >
                                            <SelectTrigger id="auth-type">
                                                <SelectValue placeholder="Select auth type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Authentication</SelectItem>
                                                <SelectItem value="bearer">Bearer Token</SelectItem>
                                                <SelectItem value="api-key">API Key (Header)</SelectItem>
                                                <SelectItem value="basic">Basic Auth</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Output Options */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Box className="h-5 w-5 text-orange-500" />
                                    Output Options
                                </h3>
                                <div className="space-y-3 pl-7">
                                    <ToggleOption
                                        label="Include Dockerfile"
                                        description="Add Dockerfile for container deployment"
                                        checked={options.includeDockerfile}
                                        onChange={(v) => updateOption('includeDockerfile', v)}
                                    />
                                    <div className="space-y-2">
                                        <Label htmlFor="ci-config">CI/CD Configuration</Label>
                                        <Select
                                            value={options.includeCIConfig}
                                            onValueChange={(v) => updateOption('includeCIConfig', v as ModalOptions['includeCIConfig'])}
                                        >
                                            <SelectTrigger id="ci-config">
                                                <SelectValue placeholder="Select CI/CD config" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No CI/CD Config</SelectItem>
                                                <SelectItem value="github">GitHub Actions</SelectItem>
                                                <SelectItem value="gitlab">GitLab CI</SelectItem>
                                                <SelectItem value="both">Both</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </section>

                            {/* Testing */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <TestTube className="h-5 w-5 text-cyan-500" />
                                    Testing & Development
                                </h3>
                                <div className="space-y-3 pl-7">
                                    <ToggleOption
                                        label="Include Test UI"
                                        description="Add a web-based UI to test API endpoints directly"
                                        checked={options.includeTestUI}
                                        onChange={(v) => updateOption('includeTestUI', v)}
                                    />
                                    <ToggleOption
                                        label="Generate Tests"
                                        description={`Include ${options.language === 'typescript' ? 'Jest' : 'pytest'} test stubs for each tool`}
                                        checked={options.generateTests}
                                        onChange={(v) => updateOption('generateTests', v)}
                                        disabled
                                        comingSoon
                                    />
                                </div>
                            </section>

                            {/* Preview */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold">Output Preview</h3>
                                <div className="bg-muted rounded-lg p-4 font-mono text-sm border">
                                    <div className="text-muted-foreground mb-2"># Files to generate:</div>
                                    <div className="space-y-1">
                                        {options.language === 'typescript' ? (
                                            <>
                                                <div>📦 package.json</div>
                                                <div>📦 tsconfig.json</div>
                                                <div>📄 src/index.ts</div>
                                            </>
                                        ) : (
                                            <>
                                                <div>📦 pyproject.toml</div>
                                                <div>📄 src/__init__.py</div>
                                                <div>📄 src/server.py</div>
                                            </>
                                        )}
                                        <div>📖 README.md</div>
                                        {options.includeDockerfile && (
                                            <div className="text-primary">🐳 Dockerfile</div>
                                        )}
                                        {(options.includeCIConfig === 'github' || options.includeCIConfig === 'both') && (
                                            <div className="text-primary">⚙️ .github/workflows/build.yml</div>
                                        )}
                                        {(options.includeCIConfig === 'gitlab' || options.includeCIConfig === 'both') && (
                                            <div className="text-primary">⚙️ .gitlab-ci.yml</div>
                                        )}
                                        {options.generateTests && (
                                            <div className="text-cyan-500">🧪 {options.language === 'typescript' ? 'src/__tests__/' : 'tests/'}</div>
                                        )}
                                        {options.includeTestUI && (
                                            <>
                                                <div className="text-green-500">🌐 test-ui/index.html</div>
                                                <div className="text-green-500">🌐 test-ui/server.{options.language === 'typescript' ? 'js' : 'py'}</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t flex items-center justify-between sm:justify-between">
                    <button
                        onClick={resetToDefaults}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        disabled={generating}
                    >
                        Reset to Defaults
                    </button>
                    <div className="flex gap-3">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            disabled={generating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={generating}
                            loading={generating}
                        >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            {generating ? 'Generating...' : 'Generate & Download'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface ToggleOptionProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
    comingSoon?: boolean;
}

const ToggleOption = ({ label, description, checked, onChange, disabled, comingSoon }: ToggleOptionProps) => (
    <label className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${disabled ? 'opacity-50' : 'hover:bg-muted cursor-pointer'}`}>
        <div className="pt-0.5">
            <Switch
                checked={checked}
                onCheckedChange={onChange}
                disabled={disabled}
                aria-label={label}
            />
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <span className="font-medium">{label}</span>
                {comingSoon && (
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
    </label>
);
