import React from 'react';
import { X, ArrowRight, FileJson, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface EndpointDetails {
    method: string;
    path: string;
    summary?: string;
    description?: string;
    parameters?: Array<{
        name: string;
        in: string;
        required?: boolean;
        type?: string;
        description?: string;
        schema?: any;
    }>;
    requestBody?: {
        description?: string;
        content?: Record<string, { schema?: any }>;
    };
    responses?: Record<string, {
        description?: string;
        content?: Record<string, { schema?: any }>;
    }>;
    tags?: string[];
}

interface EndpointDetailsPanelProps {
    endpoint: EndpointDetails | null;
    onClose: () => void;
}

const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400 border-green-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PATCH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const EndpointDetailsPanel: React.FC<EndpointDetailsPanelProps> = ({ endpoint, onClose }) => {
    if (!endpoint) return null;

    const methodColor = methodColors[endpoint.method.toUpperCase()] || 'bg-muted text-muted-foreground';

    const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];
    const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
    const headerParams = endpoint.parameters?.filter(p => p.in === 'header') || [];

    return (
        <div className="fixed right-0 top-0 h-full w-[400px] bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-primary" />
                    Endpoint Details
                </h2>
                <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close panel">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Method + Path */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-mono font-bold border ${methodColor}`}>
                            {endpoint.method.toUpperCase()}
                        </span>
                        <code className="text-sm font-mono text-foreground break-all">{endpoint.path}</code>
                    </div>
                    {endpoint.summary && (
                        <p className="text-sm text-foreground font-medium">{endpoint.summary}</p>
                    )}
                    {endpoint.description && (
                        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    )}
                    {endpoint.tags && endpoint.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                            {endpoint.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Path Parameters */}
                {pathParams.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Path Parameters</h3>
                        <div className="space-y-1">
                            {pathParams.map(param => (
                                <div key={param.name} className="flex items-start gap-2 p-2 bg-muted/30 rounded text-sm">
                                    <code className="text-primary font-mono">{param.name}</code>
                                    {param.required && <span className="text-red-400 text-xs">*</span>}
                                    <span className="text-muted-foreground text-xs">{param.type || param.schema?.type || 'string'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Query Parameters */}
                {queryParams.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Query Parameters</h3>
                        <div className="space-y-1">
                            {queryParams.map(param => (
                                <div key={param.name} className="flex items-start gap-2 p-2 bg-muted/30 rounded text-sm">
                                    <code className="text-primary font-mono">{param.name}</code>
                                    {param.required && <span className="text-red-400 text-xs">*</span>}
                                    <span className="text-muted-foreground text-xs">{param.type || param.schema?.type || 'string'}</span>
                                    {param.description && (
                                        <span className="text-muted-foreground text-xs ml-auto">{param.description}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Header Parameters */}
                {headerParams.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Headers</h3>
                        <div className="space-y-1">
                            {headerParams.map(param => (
                                <div key={param.name} className="flex items-start gap-2 p-2 bg-muted/30 rounded text-sm">
                                    <code className="text-primary font-mono">{param.name}</code>
                                    {param.required && <span className="text-red-400 text-xs">*</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Request Body */}
                {endpoint.requestBody && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Request Body
                        </h3>
                        {endpoint.requestBody.description && (
                            <p className="text-sm text-muted-foreground">{endpoint.requestBody.description}</p>
                        )}
                        {endpoint.requestBody.content && (
                            <div className="space-y-1">
                                {Object.entries(endpoint.requestBody.content).map(([contentType, details]) => (
                                    <div key={contentType} className="p-2 bg-muted/30 rounded">
                                        <code className="text-xs text-primary">{contentType}</code>
                                        {details.schema && (
                                            <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                                                {JSON.stringify(details.schema, null, 2).slice(0, 200)}...
                                            </pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Responses */}
                {endpoint.responses && Object.keys(endpoint.responses).length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Responses
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(endpoint.responses).map(([code, response]) => {
                                const isSuccess = code.startsWith('2');
                                const isError = code.startsWith('4') || code.startsWith('5');
                                const codeColor = isSuccess ? 'text-green-400' : isError ? 'text-red-400' : 'text-yellow-400';

                                return (
                                    <div key={code} className="p-2 bg-muted/30 rounded">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono font-bold ${codeColor}`}>{code}</span>
                                            <span className="text-sm text-muted-foreground">{response.description}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
