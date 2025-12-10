import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { CommandPalette } from './ui/CommandPalette';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Github } from 'lucide-react';

const APP_VERSION = '0.1.0';

export const Layout: React.FC = () => {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-float" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-accent/20 blur-[100px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[30%] rounded-full bg-primary/10 blur-[140px] animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      <Navbar />
      {/* Command Palette - accessible via Ctrl+K / ⌘K */}
      <CommandPalette />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="/docs" className="hover:text-foreground transition-colors">
              Documentation
            </a>
            <Separator orientation="vertical" className="h-4" />
            <a href="/api" className="hover:text-foreground transition-colors">
              API
            </a>
            <Separator orientation="vertical" className="h-4" />
            <a href="/status" className="hover:text-foreground transition-colors">
              Status
            </a>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href="https://github.com/tomer1983/swagger2mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
              aria-label="View source on GitHub"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{import.meta.env.MODE}</Badge>
              <span>v{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
