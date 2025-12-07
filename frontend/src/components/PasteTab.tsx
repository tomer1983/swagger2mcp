import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as yaml from 'js-yaml';
import { CheckCircle2, XCircle, FileJson, FileCode } from 'lucide-react';
import { pasteSchema } from '../lib/api';
import { Button } from './ui/button';
import { useToast } from './ui/toast';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface PasteTabProps {
    onJobCreated: () => void;
}

type ValidationState = 'idle' | 'valid' | 'invalid';

const placeholder = `// Paste your OpenAPI/Swagger specification here
// Supports both JSON and YAML formats

{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  "paths": {}
}`;

const detectFormat = (content: string): 'json' | 'yaml' => {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    return 'yaml';
};

export const PasteTab = ({ onJobCreated }: PasteTabProps) => {
    const [content, setContent] = useState('');
    const [format, setFormat] = useState<'json' | 'yaml'>('json');
    const [validationState, setValidationState] = useState<ValidationState>('idle');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Debounced validation
    useEffect(() => {
        if (!content.trim()) {
            setValidationState('idle');
            setValidationError(null);
            return;
        }

        const detectedFormat = detectFormat(content);
        setFormat(detectedFormat);

        const timeoutId = setTimeout(() => {
            try {
                let parsed: unknown;
                
                if (detectedFormat === 'json') {
                    parsed = JSON.parse(content);
                } else {
                    parsed = yaml.load(content);
                }

                // Check for swagger or openapi property
                if (parsed && typeof parsed === 'object' && ('swagger' in (parsed as Record<string, unknown>) || 'openapi' in (parsed as Record<string, unknown>))) {
                    setValidationState('valid');
                    setValidationError(null);
                } else {
                    setValidationState('invalid');
                    setValidationError('Missing "swagger" or "openapi" property. Please ensure this is a valid OpenAPI/Swagger specification.');
                }
            } catch (e: unknown) {
                setValidationState('invalid');
                setValidationError((e as Error).message || 'Invalid syntax');
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [content]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        setContent(value || '');
    }, []);

    const handleSubmit = async () => {
        if (validationState !== 'valid' || loading) return;

        setLoading(true);
        try {
            const result = await pasteSchema(content);
            toast.success('Schema Submitted', result.message || 'Schema is being processed');
            onJobCreated();
            setContent('');
            setValidationState('idle');
            setValidationError(null);
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (error as { message?: string })?.message || 'Unknown error';
            toast.error('Submission Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const isValid = validationState === 'valid';

    return (
        <div className="space-y-4">
            {/* Header with format badge and validation status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {content && (
                        <Badge variant="secondary" className="gap-1">
                            {format === 'json' ? (
                                <FileJson className="h-3.5 w-3.5" />
                            ) : (
                                <FileCode className="h-3.5 w-3.5" />
                            )}
                            {format.toUpperCase()}
                        </Badge>
                    )}
                    {content && validationState !== 'idle' && (
                        <Badge variant={validationState === 'valid' ? 'default' : 'destructive'} className="gap-1">
                            {validationState === 'valid' ? (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Valid
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-3.5 w-3.5" />
                                    Invalid
                                </>
                            )}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Monaco Editor */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <Editor
                        height="400px"
                        language={format}
                        value={content}
                        onChange={handleEditorChange}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                        }}
                    />
                    {!content && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <pre className="text-muted-foreground text-sm whitespace-pre-wrap text-center">
                                {placeholder}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Error panel */}
            {validationError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3">
                    <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-destructive font-medium">Validation Error</h4>
                            <p className="text-destructive/80 text-sm mt-1">{validationError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit button */}
            <Button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                loading={loading}
                className="w-full"
                size="lg"
            >
                {loading ? 'Processing...' : 'Submit Schema'}
            </Button>
        </div>
    );
};
