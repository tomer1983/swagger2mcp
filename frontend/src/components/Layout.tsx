import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { CommandPalette } from './ui/CommandPalette';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

export const Layout: React.FC = () => {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      {/* Command Palette - accessible via Ctrl+K / ⌘K */}
      <CommandPalette />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex gap-4 text-sm text-muted-foreground">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-xs">{import.meta.env.MODE}</Badge>
            <span>v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
