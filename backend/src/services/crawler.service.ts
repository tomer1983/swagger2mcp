import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface CrawlOptions {
    authHeaders?: Record<string, string>;
    rateLimit?: number; // Delay in ms between requests
    userAgent?: string;
    followRedirects?: boolean;
    signal?: AbortSignal; // For cancellation support
    onProgress?: (current: number, total: number, url: string) => void;
}

export interface CrawlCheckpoint {
    visited: string[];
    pending: Array<{ url: string; depth: number }>;
    specs: string[];
}

export class CrawlerService {
    private visited = new Set<string>();
    private pending: Array<{ url: string; depth: number }> = [];
    private specs: string[] = [];
    private totalUrls = 0;
    private processedUrls = 0;

    async crawl(
        startUrl: string, 
        maxDepth: number, 
        options: CrawlOptions = {}
    ): Promise<string[]> {
        this.visited.clear();
        this.pending = [];
        this.specs = [];
        this.totalUrls = 1;
        this.processedUrls = 0;

        await this.visit(startUrl, 0, maxDepth, options);
        return this.specs;
    }

    /**
     * Resume crawl from a checkpoint
     */
    async resumeFromCheckpoint(
        checkpoint: CrawlCheckpoint,
        maxDepth: number,
        options: CrawlOptions = {}
    ): Promise<string[]> {
        this.visited = new Set(checkpoint.visited);
        this.pending = [...checkpoint.pending];
        this.specs = [...checkpoint.specs];
        this.totalUrls = this.visited.size + this.pending.length;
        this.processedUrls = this.visited.size;

        // Process remaining pending URLs
        while (this.pending.length > 0) {
            if (options.signal?.aborted) {
                console.log('Crawl aborted, saving checkpoint');
                break;
            }

            const { url, depth } = this.pending.shift()!;
            await this.visit(url, depth, maxDepth, options);
        }

        return this.specs;
    }

    /**
     * Get current crawl state as checkpoint
     */
    getCheckpoint(): CrawlCheckpoint {
        return {
            visited: Array.from(this.visited),
            pending: [...this.pending],
            specs: [...this.specs],
        };
    }

    private async visit(
        url: string, 
        depth: number, 
        maxDepth: number, 
        options: CrawlOptions
    ) {
        if (this.visited.has(url) || depth > maxDepth) return;
        
        // Check for abort signal
        if (options.signal?.aborted) {
            return;
        }

        this.visited.add(url);
        this.processedUrls++;

        // Report progress
        if (options.onProgress) {
            options.onProgress(this.processedUrls, this.totalUrls, url);
        }

        try {
            console.log(`Crawling ${url} (Depth: ${depth})`);

            // Apply rate limiting
            if (options.rateLimit && options.rateLimit > 0) {
                await new Promise(resolve => setTimeout(resolve, options.rateLimit));
            }

            // Build axios config with options
            const config: AxiosRequestConfig = {
                signal: options.signal as any,
                maxRedirects: options.followRedirects === false ? 0 : 5,
                headers: {
                    'User-Agent': options.userAgent || 'Swagger2MCP-Crawler/1.0',
                    ...options.authHeaders,
                },
            };

            const response = await axios.get(url, config);
            const contentType = response.headers['content-type'];

            // Check if it's a JSON/YAML file directly
            if (contentType?.includes('application/json') || contentType?.includes('application/yaml') || url.endsWith('.json') || url.endsWith('.yaml')) {
                // Simple heuristic: check if it looks like swagger/openapi
                if (typeof response.data === 'object' && (response.data.swagger || response.data.openapi)) {
                    this.specs.push(url);
                    return;
                }
            }

            // If HTML, parse and find links
            if (contentType?.includes('text/html')) {
                const $ = cheerio.load(response.data);
                const links: string[] = [];

                $('a').each((_, el) => {
                    const href = $(el).attr('href');
                    if (href) {
                        try {
                            const absoluteUrl = new URL(href, url).toString();
                            links.push(absoluteUrl);
                        } catch (e) {
                            // Ignore invalid URLs
                        }
                    }
                });

                // Add links to pending queue for tracking
                const newLinks = links.filter(link => !this.visited.has(link));
                this.totalUrls += newLinks.length;

                for (const link of links) {
                    // Check abort before processing each link
                    if (options.signal?.aborted) {
                        // Save remaining links to pending
                        const remainingLinks = links.slice(links.indexOf(link));
                        this.pending.push(...remainingLinks.map(l => ({ url: l, depth: depth + 1 })));
                        return;
                    }

                    // Heuristic: prioritize links that look like specs or docs
                    if (link.includes('swagger') || link.includes('openapi') || link.includes('api-docs') || link.endsWith('.json') || link.endsWith('.yaml')) {
                        await this.visit(link, depth + 1, maxDepth, options);
                    } else if (depth < maxDepth) {
                        // Only follow other links if we haven't reached max depth
                        // To avoid exploding, limit to same domain
                        if (new URL(link).hostname === new URL(url).hostname) {
                            await this.visit(link, depth + 1, maxDepth, options);
                        }
                    }
                }
            }
        } catch (error: any) {
            // Don't log abort errors
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error(`Error crawling ${url}:`, error.message);
            }
        }
    }
}
