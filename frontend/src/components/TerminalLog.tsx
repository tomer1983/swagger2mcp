import React, { useRef, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { cn } from '../lib/utils';
import { Terminal } from 'lucide-react';

interface LogEntry {
    type: 'info' | 'success' | 'warning' | 'error' | 'cmd';
    message: string;
    timestamp?: string;
}

interface TerminalLogProps {
    logs: LogEntry[];
    className?: string;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs, className }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className={cn("font-mono text-sm leading-relaxed", className)}>
            <div className="flex items-center gap-2 mb-4 text-muted-foreground border-b border-border/40 pb-2">
                <Terminal className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">System Console</span>
            </div>

            <div className="space-y-2">
                {logs.map((log, index) => (
                    <div key={index} className="flex gap-3">
                        <span className="text-muted-foreground/50 select-none text-xs w-[80px]">
                            {log.timestamp || new Date().toLocaleTimeString()}
                        </span>
                        <div className="flex-1 break-all">
                            {log.type === 'cmd' && (
                                <span className="text-accent mr-2">$</span>
                            )}

                            {/* Only animate the last entry if it's new, otherwise static */}
                            {index === logs.length - 1 ? (
                                <TypeAnimation
                                    sequence={[log.message]}
                                    wrapper="span"
                                    cursor={false}
                                    speed={80}
                                    style={{
                                        color: getColor(log.type)
                                    }}
                                />
                            ) : (
                                <span style={{ color: getColor(log.type) }}>
                                    {log.message}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

function getColor(type: LogEntry['type']) {
    switch (type) {
        case 'error': return 'var(--destructive)';
        case 'success': return 'oklch(0.65 0.25 150)'; // success green
        case 'warning': return 'var(--accent)';
        case 'cmd': return 'var(--foreground)';
        default: return 'var(--muted-foreground)';
    }
}
