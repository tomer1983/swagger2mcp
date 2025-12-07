import React, { useState } from 'react';
import { UploadTab } from '../components/UploadTab';
import { CrawlTab } from '../components/CrawlTab';
import { PasteTab } from '../components/PasteTab';
import { FileUp, Globe, ClipboardPaste, Sparkles } from 'lucide-react';

export const GeneratePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'crawl'>('upload');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          MCP Generation
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Generate MCP Server
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload an OpenAPI schema file or crawl a URL to discover schemas automatically.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 p-1 bg-muted/50 rounded-xl w-fit">
        <button
          data-tab="upload"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          <FileUp className="w-4 h-4" />
          Upload File
        </button>
        <button
          data-tab="paste"
          onClick={() => setActiveTab('paste')}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'paste'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          Paste Schema
        </button>
        <button
          data-tab="crawl"
          onClick={() => setActiveTab('crawl')}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'crawl'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          <Globe className="w-4 h-4" />
          Crawl URL
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-sm">
        {activeTab === 'upload' && <UploadTab onJobCreated={(_jobId) => console.log('Job created:', _jobId)} />}
        {activeTab === 'paste' && <PasteTab onJobCreated={() => console.log('Schema pasted')} />}
        {activeTab === 'crawl' && <CrawlTab onJobCreated={(_jobId) => console.log('Crawl job created:', _jobId)} />}
      </div>
    </div>
  );
};
