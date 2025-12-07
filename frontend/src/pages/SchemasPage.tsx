import React, { useState } from 'react';
import { SchemaList } from '../components/SchemaList';
import { Database } from 'lucide-react';

export const SchemasPage: React.FC = () => {
  const [refreshKey] = useState(0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
          <Database className="w-3.5 h-3.5" />
          Schema Management
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Your Schemas
        </h1>
        <p className="text-muted-foreground text-lg">
          View and manage all your uploaded and crawled OpenAPI schemas.
        </p>
      </div>

      <SchemaList refresh={refreshKey} />
    </div>
  );
};
