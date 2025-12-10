import React, { useState } from 'react';
import { UploadTab } from '../components/UploadTab';
import { CrawlTab } from '../components/CrawlTab';
import { PasteTab } from '../components/PasteTab';
import { TerminalLog } from '../components/TerminalLog';
import { FileUp, Globe, ClipboardPaste } from 'lucide-react';

export const GeneratePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'crawl'>('upload');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // Simulation of "Matrix" generation logs
  const startSimulation = () => {
    setIsGenerating(true);
    setLogs([{ type: 'cmd', message: 'init_sequence --target=openapi_spec' }]);

    const sequence = [
      { delay: 800, msg: 'Analyzing schema structure...', type: 'info' },
      { delay: 1600, msg: 'Found 12 paths and 4 definitions.', type: 'info' },
      { delay: 2400, msg: 'Validating references... OK', type: 'success' },
      { delay: 3200, msg: 'Generating Typescript interfaces...', type: 'info' },
      { delay: 4500, msg: 'Constructing MCP resource handlers...', type: 'info' },
      { delay: 5500, msg: 'Optimizing prompt context window...', type: 'warning' },
      { delay: 7000, msg: 'Build complete. Server ready.', type: 'success' },
    ];

    let accumulatedDelay = 0;
    sequence.forEach(({ delay, msg, type }) => {
      accumulatedDelay += delay;
      setTimeout(() => {
        setLogs(prev => [...prev, { type, message: msg }]);
      }, accumulatedDelay);
    });

    setTimeout(() => {
      setLogs(prev => [...prev, { type: 'cmd', message: 'process_exit(0)' }]);
      // In real app, we would redirect here or show download button
    }, accumulatedDelay + 1000);
  };

  const handleJobCreated = (jobId: string) => {
    console.log('Job Started:', jobId);
    startSimulation();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header - Terminal Style */}
      <div className="mb-8 font-mono">
        <div className="text-sm text-primary mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          SYSTEM_READY
        </div>
        <h1 className="text-4xl font-bold text-foreground tracking-tight">
          MCP GENERATION MATRIX
        </h1>
        <p className="text-muted-foreground mt-2">
          {'>'} Select input vector to initialize server construction sequence.
        </p>
      </div>

      {isGenerating ? (
        <div className="glass-card rounded-xl border border-primary/20 p-6 min-h-[400px] flex flex-col bg-black/40">
          <TerminalLog logs={logs} className="flex-1" />
          <button
            onClick={() => { setIsGenerating(false); setLogs([]) }}
            className="mt-4 self-end text-xs text-muted-foreground hover:text-foreground underline font-mono"
          >
            [RESET_SEQUENCE]
          </button>
        </div>
      ) : (
        <>
          {/* Tab Navigation - Cyber Style */}
          <div className="flex gap-4 mb-8 border-b border-border/40 pb-1">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-3 font-mono text-sm border-b-2 transition-all duration-300 ${activeTab === 'upload'
                ? 'border-primary text-primary shadow-[0_4px_12px_-4px_var(--primary)]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <FileUp className="w-4 h-4" />
              [UPLOAD_BINARY]
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-4 py-3 font-mono text-sm border-b-2 transition-all duration-300 ${activeTab === 'paste'
                ? 'border-primary text-primary shadow-[0_4px_12px_-4px_var(--primary)]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              [INPUT_BUFFER]
            </button>
            <button
              onClick={() => setActiveTab('crawl')}
              className={`flex items-center gap-2 px-4 py-3 font-mono text-sm border-b-2 transition-all duration-300 ${activeTab === 'crawl'
                ? 'border-primary text-primary shadow-[0_4px_12px_-4px_var(--primary)]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Globe className="w-4 h-4" />
              [NETWORK_CRAWL]
            </button>
          </div>

          {/* Content Area - Glass Card */}
          <div className="glass-card rounded-xl border border-border/40 p-1 bg-gradient-to-br from-white/5 to-transparent">
            <div className="bg-background/40 backdrop-blur-md rounded-lg p-8">
              {activeTab === 'upload' && <UploadTab onJobCreated={handleJobCreated} />}
              {activeTab === 'paste' && <PasteTab onJobCreated={() => handleJobCreated('paste-job')} />}
              {activeTab === 'crawl' && <CrawlTab onJobCreated={(id) => handleJobCreated(id)} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
