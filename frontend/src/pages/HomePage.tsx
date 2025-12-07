import React from 'react';
import { Code2, Zap, Github, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20 relative">
        {/* Decorative gradient blur */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl opacity-40" />
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
          <Sparkles className="w-4 h-4" />
          AI-Powered API Integration
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Transform OpenAPI to
          <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            MCP Servers
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Convert your Swagger/OpenAPI schemas into Model Context Protocol (MCP) servers automatically.
          Upload files or crawl URLs to get started in seconds.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/generate">
            <Button variant="default" size="lg" className="gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/docs">
            <Button variant="outline" size="lg">
              Documentation
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 py-16">
        <div className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sky-500/20 to-sky-500/10 rounded-xl mb-5 group-hover:scale-110 transition-transform duration-300">
            <Code2 className="w-7 h-7 text-sky-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Auto-Generate MCP Servers
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Instantly convert any OpenAPI schema into a fully functional MCP server with type-safe TypeScript code.
          </p>
        </div>

        <div className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 rounded-xl mb-5 group-hover:scale-110 transition-transform duration-300">
            <Zap className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Upload or Crawl
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Upload JSON/YAML files directly or provide a URL to crawl and discover OpenAPI schemas automatically.
          </p>
        </div>

        <div className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-500/10 rounded-xl mb-5 group-hover:scale-110 transition-transform duration-300">
            <Github className="w-7 h-7 text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Export to GitHub
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            One-click export to create a new GitHub repository with your generated MCP server ready to deploy.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative rounded-3xl p-12 text-center overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10 border border-primary/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <h2 className="text-3xl font-bold text-foreground mb-4 relative">
          Ready to Get Started?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 relative max-w-xl mx-auto">
          Upload your first OpenAPI schema and generate an MCP server in minutes.
        </p>
        <Link to="/generate" className="relative">
          <Button variant="default" size="lg" className="gap-2">
            Start Generating
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
