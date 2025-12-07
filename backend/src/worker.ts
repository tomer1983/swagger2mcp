import { Worker } from 'bullmq';
import { connection } from './lib/queue';
import { JobData } from './types/jobs';
import { CrawlerService } from './services/crawler.service';
import { GeneratorService } from './services/generator.service';
import { webhookService } from './services/webhook.service';
import { prisma } from './lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import yaml from 'js-yaml';
import JSZip from 'jszip';
// @ts-ignore
import OpenAPISchemaValidator from 'openapi-schema-validator';

const crawlerService = new CrawlerService();
const generatorService = new GeneratorService();

/**
 * Parse file content as JSON or YAML
 * Detects format based on file extension or content
 */
function parseOpenApiSpec(content: string, filePath: string): any {
    const isYamlFile = filePath.endsWith('.yaml') || filePath.endsWith('.yml');
    
    // Try YAML first if it's a .yaml/.yml file
    if (isYamlFile) {
        try {
            const parsed = yaml.load(content);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        } catch (e) {
            // Fall through to JSON parsing
        }
    }
    
    // Try JSON parsing
    try {
        return JSON.parse(content);
    } catch (e) {
        // If JSON fails and it wasn't explicitly a YAML file, try YAML as fallback
        if (!isYamlFile) {
            try {
                const parsed = yaml.load(content);
                if (parsed && typeof parsed === 'object') {
                    return parsed;
                }
            } catch (yamlError) {
                // Both failed
            }
        }
        throw new Error('Invalid file format: could not parse as JSON or YAML');
    }
}

const worker = new Worker<JobData>('jobQueue', async (job) => {
    console.log(`Processing job ${job.id} of type ${job.data.type}`);

    try {
        switch (job.data.type) {
            case 'UPLOAD':
                await handleUpload(job.data.payload, job.data.sessionId, job.data.userId || null);
                // Trigger webhook on success
                await webhookService.onJobCompleted(job.data.sessionId, String(job.id), 'UPLOAD');
                break;
            case 'CRAWL':
                await handleCrawl(job.data.payload, job.data.sessionId, job, job.data.userId || null);
                // Trigger webhook on success
                await webhookService.onJobCompleted(job.data.sessionId, String(job.id), 'CRAWL');
                break;
            case 'BATCH_GENERATE':
                const result = await handleBatchGenerate(job.data.payload, job.data.sessionId, job);
                // Trigger webhook on success with result (download URL or similar could be added)
                await webhookService.onJobCompleted(job.data.sessionId, String(job.id), 'BATCH_GENERATE', result);
                break;
            case 'PASTE':
                await handlePaste(job.data.payload, job.data.sessionId, job.data.userId || null);
                // Trigger webhook on success
                await webhookService.onJobCompleted(job.data.sessionId, String(job.id), 'PASTE');
                break;
            default:
                throw new Error(`Unknown job type: ${job.data.type}`);
        }
    } catch (e: any) {
        console.error(`Job ${job.id} failed:`, e);
        // Trigger webhook on failure
        await webhookService.onJobFailed(job.data.sessionId, String(job.id), job.data.type, e.message);
        throw e;
    }
}, { connection });

async function handleUpload(payload: any, sessionId: string, userId: string | null) {
    const { filePath } = payload;
    if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Parse as JSON or YAML
    const json = parseOpenApiSpec(content, filePath);
    
    // Validate it's an OpenAPI/Swagger spec
    if (!json.swagger && !json.openapi) {
        // Clean up file on validation failure
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
        throw new Error('Invalid OpenAPI/Swagger spec: missing "swagger" or "openapi" property');
    }

    // Enhanced validation (Issue #13)
    try {
        const version = json.openapi ? 3 : 2;
        const validator = new OpenAPISchemaValidator({ version });
        const validationResult = validator.validate(json);
        
        if (validationResult.errors && validationResult.errors.length > 0) {
            // Clean up file on validation failure
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
            throw new Error(`Schema validation failed: ${validationResult.errors[0].message}`);
        }
    } catch (e: any) {
        // If validation throws (e.g. invalid version), fail the job
        if (e.message.startsWith('Schema validation failed')) throw e;
        console.warn('Validation library warning:', e);
    }

    // Save to DB
    const schema = await prisma.schema.create({
        data: {
            session: {
                connectOrCreate: {
                    where: { id: sessionId },
                    create: userId 
                        ? { id: sessionId, user: { connect: { id: userId } } }
                        : { id: sessionId }
                }
            },
            ...(userId && { user: { connect: { id: userId } } }),
            type: 'UPLOAD',
            content: JSON.stringify(json),
        },
    });

    // Trigger webhook (Issue #12)
    await webhookService.onSchemaCreated(sessionId, schema.id, json.info?.title);
    
    // Clean up uploaded file after successful processing (Issue #9)
    try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up uploaded file: ${filePath}`);
    } catch (e) {
        console.warn(`Failed to clean up file ${filePath}:`, e);
    }
    
    console.log('Upload processed and saved to DB.');
}

async function handlePaste(payload: any, sessionId: string, userId: string | null) {
    const { content } = payload;
    
    if (!content || typeof content !== 'string') {
        throw new Error('No content provided for paste');
    }
    
    // Parse as JSON or YAML (use dummy path 'paste.json' for format detection)
    const json = parseOpenApiSpec(content, 'paste.json');
    
    // Validate it's an OpenAPI/Swagger spec
    if (!json.swagger && !json.openapi) {
        throw new Error('Invalid OpenAPI/Swagger spec: missing "swagger" or "openapi" property');
    }

    // Enhanced validation
    try {
        const version = json.openapi ? 3 : 2;
        const validator = new OpenAPISchemaValidator({ version });
        const validationResult = validator.validate(json);
        
        if (validationResult.errors && validationResult.errors.length > 0) {
            throw new Error(`Schema validation failed: ${validationResult.errors[0].message}`);
        }
    } catch (e: any) {
        // If validation throws (e.g. invalid version), fail the job
        if (e.message.startsWith('Schema validation failed')) throw e;
        console.warn('Validation library warning:', e);
    }

    // Save to DB
    const schema = await prisma.schema.create({
        data: {
            session: {
                connectOrCreate: {
                    where: { id: sessionId },
                    create: userId 
                        ? { id: sessionId, user: { connect: { id: userId } } }
                        : { id: sessionId }
                }
            },
            ...(userId && { user: { connect: { id: userId } } }),
            type: 'PASTE',
            content: JSON.stringify(json),
        },
    });

    // Trigger webhook
    await webhookService.onSchemaCreated(sessionId, schema.id, json.info?.title);
    
    console.log('Paste processed and saved to DB.');
}

async function handleCrawl(payload: any, sessionId: string, job: any, userId: string | null) {
    const { url, depth, options = {} } = payload;
    const { authHeaders, rateLimit, userAgent, followRedirects } = options;
    
    await job.updateProgress(10);
    
    // Create abort controller for cancellation support
    const abortController = new AbortController();
    
    // Check for cancellation periodically
    const checkInterval = setInterval(async () => {
        try {
            const isActive = await job.isActive();
            if (!isActive) {
                console.log(`Job ${job.id} is no longer active, aborting crawl`);
                abortController.abort();
                clearInterval(checkInterval);
            }
        } catch (e) {
            // Ignore errors checking status
        }
    }, 2000);
    
    const crawlOptions = {
        authHeaders,
        rateLimit,
        userAgent,
        followRedirects,
        signal: abortController.signal,
        onProgress: (current: number, total: number, currentUrl: string) => {
            // Update progress proportionally (10% to 90% range)
            const progress = 10 + Math.floor((current / Math.max(total, 1)) * 80);
            job.updateProgress(progress);
            console.log(`Crawl progress: ${current}/${total} - ${currentUrl}`);
        }
    };
    
    let specs: string[] = [];
    
    try {
        // Check if we're resuming from a checkpoint
        const checkpoint = payload.checkpoint;
        if (checkpoint) {
            console.log(`Resuming crawl from checkpoint with ${checkpoint.visited.length} visited URLs`);
            specs = await crawlerService.resumeFromCheckpoint(checkpoint, depth, crawlOptions);
        } else {
            specs = await crawlerService.crawl(url, depth, crawlOptions);
        }
    } catch (error: any) {
        clearInterval(checkInterval);
        // If aborted, save checkpoint for potential resume
        if (error.name === 'AbortError' || error.name === 'CanceledError' || abortController.signal.aborted) {
            const checkpoint = crawlerService.getCheckpoint();
            await job.updateData({
                ...job.data,
                checkpoint,
            });
            console.log('Crawl aborted, checkpoint saved');
            throw new Error('Crawl cancelled by user');
        }
        throw error;
    }
    
    clearInterval(checkInterval);
    await job.updateProgress(90);

    console.log(`Crawl complete. Found ${specs.length} specs.`);

    for (const specUrl of specs) {
        try {
            const response = await axios.get(specUrl);
            const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

            // Basic validation
            const json = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            if (json.swagger || json.openapi) {
                await prisma.schema.create({
                    data: {
                        session: {
                            connectOrCreate: {
                                where: { id: sessionId },
                                create: userId 
                                    ? { id: sessionId, user: { connect: { id: userId } } }
                                    : { id: sessionId }
                            }
                        },
                        ...(userId && { user: { connect: { id: userId } } }),
                        type: 'CRAWL',
                        url: specUrl,
                        content: JSON.stringify(json),
                    },
                });
            }
        } catch (e) {
            console.error(`Failed to fetch/save spec from ${specUrl}`, e);
        }
    }
    await job.updateProgress(100);
}

async function handleBatchGenerate(payload: any, sessionId: string, job: any) {
    const { schemaIds, language, options = {} } = payload;
    
    if (!Array.isArray(schemaIds) || schemaIds.length === 0) {
        throw new Error('schemaIds array is required');
    }

    const batchZip = new JSZip();
    let completed = 0;
    const total = schemaIds.length;

    for (const schemaId of schemaIds) {
        const schema = await prisma.schema.findUnique({
            where: { id: schemaId },
        });

        if (schema) {
            try {
                const spec = JSON.parse(schema.content);
                const zipBuffer = await generatorService.generate(spec, language || 'typescript', options);
                
                // Load the generated zip
                const schemaZip = await JSZip.loadAsync(zipBuffer);
                
                // Add to batch zip under a folder named after the schema ID or title
                const folderName = spec.info?.title?.replace(/[^a-zA-Z0-9]/g, '-') || schemaId;
                const folder = batchZip.folder(folderName);
                
                if (folder) {
                    schemaZip.forEach((relativePath, file) => {
                        folder.file(relativePath, file.async('nodebuffer'));
                    });
                }
            } catch (e) {
                console.error(`Failed to generate for schema ${schemaId}:`, e);
                batchZip.file(`${schemaId}-error.txt`, `Generation failed: ${e}`);
            }
        }
        
        completed++;
        await job.updateProgress(Math.floor((completed / total) * 100));
    }

    const content = await batchZip.generateAsync({ type: 'nodebuffer' });
    
    // Save to disk
    const fileName = `batch-${Date.now()}-${crypto.randomUUID()}.zip`;
    const downloadDir = path.join(__dirname, '../downloads');
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }
    const filePath = path.join(downloadDir, fileName);
    fs.writeFileSync(filePath, content);
    
    return { fileName, downloadUrl: `/api/downloads/${fileName}` };
}

console.log('Worker started');
