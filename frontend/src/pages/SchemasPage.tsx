import React, { useState } from 'react';
import { SchemaList } from '../components/SchemaList';
import { SchemaGraph } from '../components/SchemaGraph';
import { Database, Network, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// Mock spec for visualization demo until we integrate real selection
const mockSpec = {
  info: { title: 'Demo API' },
  paths: {
    '/users': {
      get: { tags: ['Users'], summary: 'Get all users', parameters: [{ name: 'limit', in: 'query', type: 'integer' }], responses: { '200': { description: 'Success' } } },
      post: { tags: ['Users'], summary: 'Create user', requestBody: { content: { 'application/json': {} } }, responses: { '201': { description: 'Created' } } }
    },
    '/users/{id}': {
      get: { tags: ['Users'], summary: 'Get user by ID', parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: { tags: ['Users'], summary: 'Update user' }
    },
    '/products': { get: { tags: ['Products'], summary: 'List products' } },
    '/orders': { post: { tags: ['Orders'], summary: 'Create order' } }
  }
};

export const SchemasPage: React.FC = () => {
  const [refreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedSchema, setSelectedSchema] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleVisualize = (schema: any) => {
    try {
      const parsed = JSON.parse(schema.content);
      setSelectedSchema(parsed);
      setActiveTab('visualizer');
    } catch (e) {
      console.error("Failed to parse schema for visualization", e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-6 flex-none">
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

      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-none">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="visualizer" className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                Neural Visualizer
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="flex-1 mt-0">
            <SchemaList refresh={refreshKey} onVisualize={handleVisualize} />
          </TabsContent>

          <TabsContent value="visualizer" className="flex-1 mt-0">
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border border-white/5">
                <p className="text-sm text-muted-foreground flex-1">
                  {selectedSchema
                    ? `Visualizing: ${selectedSchema.info?.title || 'Unknown Schema'}`
                    : 'Select a schema from the list to visualize it (Showing Demo Graph below).'}
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search paths..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-[200px]"
                  />
                </div>
              </div>
              <SchemaGraph spec={selectedSchema || mockSpec} searchQuery={searchQuery} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

