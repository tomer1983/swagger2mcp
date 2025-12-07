import { useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadSchema } from '../lib/api';
import { Button } from './ui/button';
import { useToast } from './ui/toast';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

export const UploadTab = ({ onJobCreated }: { onJobCreated: (jobId: string) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const toast = useToast();

    const validateFile = (file: File): string | null => {
        const validExtensions = ['.json', '.yaml', '.yml'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
            return 'Invalid file format. Please upload a JSON or YAML file.';
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return 'File too large. Maximum size is 10MB.';
        }
        
        return null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const validationError = validateFile(selectedFile);
            
            if (validationError) {
                setError(validationError);
                setFile(null);
                toast.error('Invalid File', validationError);
            } else {
                setFile(selectedFile);
                setError('');
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            const validationError = validateFile(droppedFile);
            if (validationError) {
                setError(validationError);
                setFile(null);
                toast.error('Invalid File', validationError);
            } else {
                setFile(droppedFile);
                setError('');
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await uploadSchema(file);
            toast.success('Upload Started', result.message);
            onJobCreated(result.jobId);
            setFile(null);
            // Reset file input
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) input.value = '';
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (error as { message?: string })?.message || 'Unknown error';
            setError(errorMessage);
            toast.error('Upload Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card
                className={cn(
                    'border-2 border-dashed transition-colors cursor-pointer',
                    isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
            >
                <CardContent className="flex flex-col items-center justify-center py-10">
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline">
                        Choose a file
                    </Label>
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".json,.yaml,.yml"
                        onChange={handleFileChange}
                        aria-label="Upload OpenAPI schema file"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Supports JSON, YAML formats (max 10MB)
                    </p>
                    {file && (
                        <div className="mt-4 flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm">
                            <span>{file.name}</span>
                            <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <Button
                onClick={handleUpload}
                disabled={!file || loading}
                loading={loading}
                className="w-full"
                size="lg"
            >
                {loading ? 'Uploading...' : 'Upload Schema'}
            </Button>
        </div>
    );
};
