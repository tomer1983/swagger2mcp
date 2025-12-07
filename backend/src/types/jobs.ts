export interface JobData {
    type: 'UPLOAD' | 'CRAWL' | 'BATCH_GENERATE' | 'PASTE';
    payload: any;
    sessionId: string;
    userId?: string | null; // User ID for authenticated users, null for anonymous
}

export interface UploadPayload {
    filePath: string;
    originalName: string;
}

export interface CrawlPayload {
    url: string;
    depth: number;
}

export interface BatchGeneratePayload {
    schemaIds: string[];
    language: string;
    options?: any;
}

export interface PastePayload {
    content: string;  // Raw JSON/YAML text pasted by user
}
