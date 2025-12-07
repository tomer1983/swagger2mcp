import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, Settings, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { crawlUrl } from '../lib/api';
import { Button } from './ui/button';
import { useToast } from './ui/toast';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';

// Zod schema for form validation
const crawlSchema = z.object({
    url: z
        .string()
        .min(1, 'URL is required')
        .url('Please enter a valid URL')
        .refine(
            (url) => {
                try {
                    const parsed = new URL(url);
                    return ['http:', 'https:'].includes(parsed.protocol);
                } catch {
                    return false;
                }
            },
            { message: 'URL must use HTTP or HTTPS protocol' }
        ),
    depth: z.number().min(1).max(5),
    authHeader: z.string().optional(),
    authValue: z.string().optional(),
    rateLimit: z.number().min(0).max(2000),
    userAgent: z.string(),
    followRedirects: z.boolean(),
});

type CrawlFormData = z.infer<typeof crawlSchema>;

export const CrawlTab = ({ onJobCreated }: { onJobCreated: (jobId: string) => void }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const toast = useToast();
    
    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<CrawlFormData>({
        resolver: zodResolver(crawlSchema),
        defaultValues: {
            url: '',
            depth: 1,
            authHeader: '',
            authValue: '',
            rateLimit: 100,
            userAgent: 'Swagger2MCP-Crawler/1.0',
            followRedirects: true,
        },
    });

    const depth = watch('depth');
    const rateLimit = watch('rateLimit');
    const followRedirects = watch('followRedirects');

    const onSubmit = async (data: CrawlFormData) => {
        try {
            // Build options object
            const options: Record<string, unknown> = {
                rateLimit: data.rateLimit,
                userAgent: data.userAgent,
                followRedirects: data.followRedirects,
            };

            // Add auth headers if provided
            if (data.authHeader && data.authValue) {
                options.authHeaders = {
                    [data.authHeader]: data.authValue,
                };
            }

            const result = await crawlUrl(data.url, data.depth, options);
            toast.success('Crawl Started', result.message);
            onJobCreated(result.jobId);
            reset(); // Clear form on success
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (error as { message?: string })?.message || 'Unknown error';
            toast.error('Crawl Failed', errorMessage);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="crawl-url">Base URL</Label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                            id="crawl-url"
                            type="url"
                            {...register('url')}
                            placeholder="https://api.example.com/docs"
                            className={cn('pl-10', errors.url && 'border-destructive')}
                            aria-describedby={errors.url ? 'url-error' : undefined}
                            aria-invalid={!!errors.url}
                        />
                    </div>
                    {errors.url && (
                        <p id="url-error" className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {errors.url.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="crawl-depth">Crawl Depth: {depth}</Label>
                    <input
                        id="crawl-depth"
                        type="range"
                        min="1"
                        max="5"
                        {...register('depth', { valueAsNumber: true })}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-secondary accent-primary"
                        aria-label={`Crawl depth: ${depth}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 (Fast)</span>
                        <span>5 (Deep)</span>
                    </div>
                </div>

                {/* Advanced Options Toggle */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                    aria-expanded={showAdvanced}
                    aria-controls="advanced-options"
                >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    Advanced Options
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* Advanced Options Panel */}
                {showAdvanced && (
                    <Card id="advanced-options">
                        <CardContent className="pt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="auth-header">Auth Header</Label>
                                    <Input
                                        id="auth-header"
                                        {...register('authHeader')}
                                        placeholder="Authorization"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="auth-value">Auth Value</Label>
                                    <Input
                                        id="auth-value"
                                        type="password"
                                        {...register('authValue')}
                                        placeholder="Bearer token123"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rate-limit">Rate Limit: {rateLimit}ms between requests</Label>
                                <input
                                    id="rate-limit"
                                    type="range"
                                    min="0"
                                    max="2000"
                                    step="100"
                                    {...register('rateLimit', { valueAsNumber: true })}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-secondary accent-primary"
                                    aria-label={`Rate limit: ${rateLimit} milliseconds`}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>No delay</span>
                                    <span>2s delay</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user-agent">User Agent</Label>
                                <Input
                                    id="user-agent"
                                    {...register('userAgent')}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="followRedirects"
                                    checked={followRedirects}
                                    onCheckedChange={(checked) => setValue('followRedirects', !!checked)}
                                />
                                <Label htmlFor="followRedirects" className="font-normal">Follow redirects</Label>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                size="lg"
                className="w-full"
            >
                {isSubmitting ? 'Starting Crawl...' : 'Start Crawl'}
            </Button>
        </form>
    );
};
