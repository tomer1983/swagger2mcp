import JSZip from 'jszip';

// Memory and size limits for schema processing (Issue #29)
const MAX_SCHEMA_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_SCHEMA_SIZE_JSON = 50 * 1024 * 1024; // 50MB JSON string length
const MEMORY_WARNING_THRESHOLD = 0.8; // 80% of heap

interface ToolDefinition {
    name: string;
    description: string;
    path: string;
    method: string;
    pathParams: string[];
    queryParams: string[];
    hasBody: boolean;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required: string[];
    };
}

export interface GenerationOptions {
    serverName?: string;
    asyncMode?: boolean;
    strictTypes?: boolean;
    includeComments?: boolean;
    generateTests?: boolean;
    includeDockerfile?: boolean;
    includeCIConfig?: 'none' | 'github' | 'gitlab' | 'both';
    routePrefix?: string;
    authType?: 'none' | 'bearer' | 'api-key' | 'basic';
    includeTestUI?: boolean;
}

const defaultOptions: GenerationOptions = {
    asyncMode: true,
    strictTypes: true,
    includeComments: true,
    generateTests: false,
    includeDockerfile: false,
    includeCIConfig: 'none',
    routePrefix: '',
    authType: 'bearer',
    includeTestUI: false,
};

export class GeneratorService {
    /**
     * Check memory usage and schema size to prevent OOM errors
     */
    private checkMemoryAndSize(schemaContent: string, schemaName: string = 'Schema'): void {
        // Check JSON string size
        const sizeBytes = Buffer.byteLength(schemaContent, 'utf8');
        if (sizeBytes > MAX_SCHEMA_SIZE_BYTES) {
            throw new Error(
                `${schemaName} size (${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_SCHEMA_SIZE_BYTES / 1024 / 1024}MB)`
            );
        }

        if (schemaContent.length > MAX_SCHEMA_SIZE_JSON) {
            throw new Error(
                `${schemaName} JSON length exceeds maximum allowed characters (${MAX_SCHEMA_SIZE_JSON})`
            );
        }

        // Check current memory usage
        const memUsage = process.memoryUsage();
        const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
        
        if (heapUsedPercent > MEMORY_WARNING_THRESHOLD) {
            console.warn(
                `High memory usage detected: ${(heapUsedPercent * 100).toFixed(1)}% of heap used ` +
                `(${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB)`
            );
        }
    }

    /**
     * Resolve a $ref pointer to the actual schema object
     * Handles #/components/schemas/Name, #/definitions/Name (Swagger 2.0), etc.
     */
    private resolveRef(spec: any, ref: string, visited: Set<string> = new Set()): any {
        if (visited.has(ref)) {
            // Circular reference detected, return empty object to prevent infinite loop
            return { type: 'object', description: `Circular reference to ${ref}` };
        }
        visited.add(ref);

        const parts = ref.replace(/^#\//, '').split('/');
        let resolved = spec;
        for (const part of parts) {
            resolved = resolved?.[part];
            if (!resolved) return {};
        }

        // If the resolved schema itself has a $ref, resolve it recursively
        if (resolved.$ref) {
            return this.resolveRef(spec, resolved.$ref, visited);
        }

        // Deep resolve any nested $refs in the schema
        return this.deepResolveRefs(spec, resolved, visited);
    }

    /**
     * Recursively resolve all $refs within a schema object
     */
    private deepResolveRefs(spec: any, schema: any, visited: Set<string> = new Set()): any {
        if (!schema || typeof schema !== 'object') return schema;

        if (schema.$ref) {
            return this.resolveRef(spec, schema.$ref, new Set(visited));
        }

        if (Array.isArray(schema)) {
            return schema.map(item => this.deepResolveRefs(spec, item, visited));
        }

        const resolved: any = {};
        for (const [key, value] of Object.entries(schema)) {
            resolved[key] = this.deepResolveRefs(spec, value, visited);
        }
        return resolved;
    }

    /**
     * Convert an OpenAPI schema to a JSON Schema compatible format for MCP
     */
    private convertToJsonSchema(spec: any, openApiSchema: any): any {
        if (!openApiSchema) return { type: 'string' };

        const resolved = openApiSchema.$ref
            ? this.resolveRef(spec, openApiSchema.$ref)
            : this.deepResolveRefs(spec, openApiSchema);

        // Remove OpenAPI-specific fields that aren't valid JSON Schema
        const { example, examples, xml, externalDocs, deprecated, ...jsonSchema } = resolved;
        return jsonSchema;
    }

    /**
     * Build the inputSchema for a tool from OpenAPI parameters and requestBody
     */
    private buildInputSchema(
        spec: any,
        parameters: any[],
        requestBody: any
    ): { schema: ToolDefinition['inputSchema']; pathParams: string[]; queryParams: string[]; hasBody: boolean } {
        const properties: Record<string, any> = {};
        const required: string[] = [];
        const pathParams: string[] = [];
        const queryParams: string[] = [];
        let hasBody = false;

        // Process parameters (path, query, header, body)
        for (const param of parameters) {
            const resolvedParam = param.$ref ? this.resolveRef(spec, param.$ref) : param;
            const paramName = resolvedParam.name;
            const paramIn = resolvedParam.in;

            if (paramIn === 'path') {
                pathParams.push(paramName);
            } else if (paramIn === 'query') {
                queryParams.push(paramName);
            } else if (paramIn === 'header') {
                // Skip header params for now, could add later
                continue;
            } else if (paramIn === 'body') {
                // Swagger 2.0 body parameter
                hasBody = true;
                const bodySchema = this.convertToJsonSchema(spec, resolvedParam.schema || { type: 'object' });
                
                if (bodySchema.properties) {
                    properties['body'] = {
                        type: 'object',
                        description: resolvedParam.description || 'Request body',
                        properties: bodySchema.properties,
                        required: bodySchema.required || []
                    };
                } else {
                    properties['body'] = bodySchema;
                    properties['body'].description = resolvedParam.description || 'Request body';
                }
                
                if (resolvedParam.required) {
                    required.push('body');
                }
                continue;
            } else if (paramIn === 'formData') {
                // Skip formData params for now - these are for multipart/form-data uploads
                continue;
            }

            properties[paramName] = this.convertToJsonSchema(spec, resolvedParam.schema || { type: 'string' });
            properties[paramName].description = resolvedParam.description || '';

            if (resolvedParam.required) {
                required.push(paramName);
            }
        }

        // Process requestBody
        if (requestBody) {
            const resolvedBody = requestBody.$ref ? this.resolveRef(spec, requestBody.$ref) : requestBody;
            const content = resolvedBody.content;

            if (content?.['application/json']?.schema) {
                hasBody = true;
                const bodySchema = this.convertToJsonSchema(spec, content['application/json'].schema);

                // If body schema has properties, merge them with a "body_" prefix or as nested "body" object
                if (bodySchema.properties) {
                    properties['body'] = {
                        type: 'object',
                        description: resolvedBody.description || 'Request body',
                        properties: bodySchema.properties,
                        required: bodySchema.required || []
                    };
                    if (resolvedBody.required) {
                        required.push('body');
                    }
                } else {
                    // Simple body type (string, array, etc.)
                    properties['body'] = bodySchema;
                    properties['body'].description = resolvedBody.description || 'Request body';
                    if (resolvedBody.required) {
                        required.push('body');
                    }
                }
            }
        }

        return {
            schema: { type: 'object', properties, required },
            pathParams,
            queryParams,
            hasBody
        };
    }

    async generate(openApiSpec: any, language: 'typescript' | 'python' = 'typescript', options: GenerationOptions = {}): Promise<Buffer> {
        // Check memory before processing (Issue #29)
        const schemaJson = JSON.stringify(openApiSpec);
        this.checkMemoryAndSize(schemaJson, 'OpenAPI Specification');

        const zip = new JSZip();
        const opts = { ...defaultOptions, ...options };

        // Set server name from spec if not provided
        if (!opts.serverName) {
            opts.serverName = (openApiSpec.info?.title || 'mcp-server')
                .replace(/[^a-zA-Z0-9]/g, '-')
                .toLowerCase()
                .replace(/^-+|-+$/g, '');
        }

        if (language === 'typescript') {
            this.generateTypeScript(zip, openApiSpec, opts);
        } else if (language === 'python') {
            this.generatePython(zip, openApiSpec, opts);
        } else {
            throw new Error(`Unsupported language: ${language}`);
        }

        // Add optional files
        if (opts.includeDockerfile) {
            this.generateDockerfile(zip, language, opts);
        }

        if (opts.includeCIConfig === 'github' || opts.includeCIConfig === 'both') {
            this.generateGitHubActions(zip, language, opts);
        }

        if (opts.includeCIConfig === 'gitlab' || opts.includeCIConfig === 'both') {
            this.generateGitLabCI(zip, language, opts);
        }

        if (opts.includeTestUI) {
            this.generateTestUI(zip, openApiSpec, language, opts);
        }

        return await zip.generateAsync({ type: 'nodebuffer' });
    }

    private generateTypeScript(zip: JSZip, spec: any, opts: GenerationOptions) {
        const serverName = opts.serverName || 'mcp-server-generated';
        
        // Build package.json with optional test-ui dependencies
        const dependencies: Record<string, string> = {
            "@modelcontextprotocol/sdk": "^0.6.0",
            "axios": "^1.6.0"
        };
        const devDependencies: Record<string, string> = {
            "typescript": "^5.0.0",
            "@types/node": "^20.0.0"
        };
        const scripts: Record<string, string> = {
            "build": "tsc",
            "start": "node dist/index.js"
        };

        if (opts.includeTestUI) {
            dependencies["express"] = "^4.18.0";
            dependencies["cors"] = "^2.8.5";
            scripts["test-ui"] = "node test-ui/server.js";
        }

        // package.json
        zip.file('package.json', JSON.stringify({
            name: serverName,
            version: spec.info?.version || '1.0.0',
            description: spec.info?.description || 'MCP Server generated from OpenAPI spec',
            type: 'module',
            scripts,
            dependencies,
            devDependencies
        }, null, 2));

        // tsconfig.json
        zip.file('tsconfig.json', JSON.stringify({
            compilerOptions: {
                target: "ES2022",
                module: "NodeNext",
                moduleResolution: "NodeNext",
                outDir: "./dist",
                rootDir: "./src",
                strict: opts.strictTypes !== false,
                esModuleInterop: true
            }
        }, null, 2));

        // src/index.ts
        const tools = this.extractTools(spec);
        const indexContent = this.generateIndexTs(tools, spec, opts);
        zip.file('src/index.ts', indexContent);

        // README.md
        this.generateReadme(zip, spec, 'typescript', opts);
    }

    private generatePython(zip: JSZip, spec: any, opts: GenerationOptions) {
        const tools = this.extractTools(spec);
        const serverName = opts.serverName || (spec.info?.title || 'Generated MCP Server').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const baseUrl = this.getBaseUrl(spec, opts);

        // pyproject.toml
        zip.file('pyproject.toml', `[project]
name = "${serverName}"
version = "${spec.info?.version || '1.0.0'}"
description = "MCP Server generated from OpenAPI spec"
requires-python = ">=3.10"
dependencies = [
    "mcp>=1.0.0",
    "httpx>=0.25.0",
    "pydantic>=2.0.0",
]

[project.scripts]
${serverName} = "src.server:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src"]
`);

        // src/__init__.py
        zip.file('src/__init__.py', '');

        // src/server.py
        const serverContent = this.generateServerPy(tools, spec, baseUrl, opts);
        zip.file('src/server.py', serverContent);

        // README.md  
        this.generateReadme(zip, spec, 'python', opts);
    }

    private getBaseUrl(spec: any, opts: GenerationOptions): string {
        const prefix = opts.routePrefix || '';
        let baseUrl = spec.servers?.[0]?.url || spec.host 
            ? `${spec.schemes?.[0] || 'https'}://${spec.host}${spec.basePath || ''}`
            : 'http://localhost';
        return baseUrl + prefix;
    }

    private generateServerPy(tools: ToolDefinition[], spec: any, baseUrl: string, opts: GenerationOptions): string {
        const serverName = spec.info?.title || 'Generated MCP Server';

        // Generate tool functions
        const toolFunctions = tools.map(t => this.generatePythonToolFunction(t)).join('\n\n');

        // Generate type hints for complex schemas
        const typeHints = this.generatePythonTypeHints(tools);

        return `"""
${serverName}
Generated MCP Server from OpenAPI specification.
"""

import os
import json
import httpx
from typing import Any, Optional
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Configuration
BASE_URL = os.environ.get("API_BASE_URL", "${baseUrl}")
API_KEY = os.environ.get("API_KEY", "")

# Initialize server
server = Server("${serverName.replace(/"/g, '\\"')}")

# HTTP client
client = httpx.Client(
    base_url=BASE_URL,
    headers={"Authorization": f"Bearer {API_KEY}"} if API_KEY else {},
    timeout=30.0,
)

${typeHints}

@server.list_tools()
async def list_tools() -> list[Tool]:
    """List all available tools."""
    return [
${tools.map(t => this.generatePythonToolDefinition(t)).join(',\n')}
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Execute a tool by name."""
${this.generatePythonToolDispatcher(tools)}


${toolFunctions}


async def main():
    """Main entry point for the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
`;
    }

    private generatePythonToolDefinition(tool: ToolDefinition): string {
        const schemaJson = JSON.stringify(tool.inputSchema, null, 12)
            .split('\n')
            .map((line, i) => i === 0 ? line : '        ' + line)
            .join('\n');
        
        return `        Tool(
            name="${tool.name}",
            description="${tool.description.replace(/"/g, '\\"')}",
            inputSchema=${schemaJson},
        )`;
    }

    private generatePythonToolFunction(tool: ToolDefinition): string {
        const funcName = tool.name.replace(/[^a-zA-Z0-9_]/g, '_');
        
        // Build URL with path parameters
        let urlExpr = `"${tool.path}"`;
        if (tool.pathParams.length > 0) {
            let pathTemplate = tool.path;
            for (const param of tool.pathParams) {
                pathTemplate = pathTemplate.replace(`{${param}}`, `{${param}}`);
            }
            urlExpr = `f"${pathTemplate}"`;
        }

        // Build query params
        const queryCode = tool.queryParams.length > 0
            ? `\n    params = {${tool.queryParams.map(p => `"${p}": arguments.get("${p}")`).join(', ')}}`
            : '';
        const paramsArg = tool.queryParams.length > 0 ? ', params=params' : '';

        // Build body/data
        const bodyCode = tool.hasBody ? '\n    data = arguments.get("body")' : '';
        const dataArg = tool.hasBody ? ', json=data' : '';

        // Extract path param args
        const pathParamExtract = tool.pathParams.length > 0
            ? '\n    ' + tool.pathParams.map(p => `${p} = arguments.get("${p}", "")`).join('\n    ')
            : '';

        return `async def ${funcName}(arguments: dict[str, Any]) -> dict:
    """${tool.description}"""${pathParamExtract}${queryCode}${bodyCode}
    url = ${urlExpr}
    response = client.${tool.method.toLowerCase()}(url${paramsArg}${dataArg})
    response.raise_for_status()
    return response.json()`;
    }

    private generatePythonToolDispatcher(tools: ToolDefinition[]): string {
        const cases = tools.map(t => {
            const funcName = t.name.replace(/[^a-zA-Z0-9_]/g, '_');
            return `    if name == "${t.name}":
        result = await ${funcName}(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]`;
        }).join('\n    el');

        return `    ${cases}
    else:
        raise ValueError(f"Unknown tool: {name}")`;
    }

    private generatePythonTypeHints(tools: ToolDefinition[]): string {
        // For now, we'll skip complex type generation
        // This could be enhanced to generate Pydantic models
        return '# Type definitions could be generated here for complex schemas';
    }

    private extractTools(spec: any): ToolDefinition[] {
        const tools: ToolDefinition[] = [];
        const paths = spec.paths || {};

        for (const [pathKey, methods] of Object.entries(paths)) {
            for (const [method, operation] of Object.entries(methods as any)) {
                if (method === 'parameters') continue;
                const op = operation as any;

                // Build input schema from parameters and requestBody
                const { schema, pathParams, queryParams, hasBody } = this.buildInputSchema(
                    spec,
                    op.parameters || [],
                    op.requestBody
                );

                tools.push({
                    name: op.operationId || `${method}_${pathKey.replace(/\//g, '_').replace(/[{}]/g, '')}`,
                    description: (op.summary || op.description || `Call ${method} on ${pathKey}`).replace(/"/g, '\\"'),
                    path: pathKey,
                    method: method.toUpperCase(),
                    pathParams,
                    queryParams,
                    hasBody,
                    inputSchema: schema,
                });
            }
        }
        return tools;
    }

    private generateIndexTs(tools: ToolDefinition[], spec: any, opts: GenerationOptions): string {
        const baseUrl = this.getBaseUrl(spec, opts);
        const authHeader = this.getAuthHeader(opts);

        // Generate the tools array for ListToolsRequestSchema
        const toolsListCode = tools.map(t => {
            const schemaJson = JSON.stringify(t.inputSchema, null, 6).replace(/\n/g, '\n      ');
            return `{
        name: "${t.name}",
        description: "${t.description}",
        inputSchema: ${schemaJson},
      }`;
        }).join(',\n      ');

        // Generate switch cases for CallToolRequestSchema
        const switchCasesCode = tools.map(t => {
            // Generate path parameter replacement code
            let urlCode = `\`\${BASE_URL}${t.path}\``;
            if (t.pathParams.length > 0) {
                let pathExpr = t.path;
                for (const param of t.pathParams) {
                    pathExpr = pathExpr.replace(`{${param}}`, `\${args?.${param} ?? ''}`);
                }
                urlCode = `\`\${BASE_URL}${pathExpr}\``;
            }

            // Generate query params object
            const queryParamsCode = t.queryParams.length > 0
                ? `params: { ${t.queryParams.map(p => `${p}: args?.${p}`).join(', ')} },`
                : '';

            // Generate data/body code
            const dataCode = t.hasBody ? `data: args?.body,` : '';

            return `
    case "${t.name}": {
      const response = await axios({
        method: "${t.method}",
        url: ${urlCode},
        ${queryParamsCode}
        ${dataCode}
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }`;
        }).join('\n    ');

        return `
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const server = new Server(
  {
    name: "${opts.serverName || (spec.info?.title || 'Generated MCP Server').replace(/"/g, '\\"')}",
    version: "${spec.info?.version || '1.0.0'}",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const BASE_URL = process.env.API_BASE_URL || "${baseUrl}";
${authHeader}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ${toolsListCode}
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    ${switchCasesCode}
    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
`;
    }

    private getAuthHeader(opts: GenerationOptions): string {
        switch (opts.authType) {
            case 'none':
                return `
function getAuthHeaders(): Record<string, string> {
  return {};
}`;
            case 'api-key':
                return `
const API_KEY = process.env.API_KEY || "";

function getAuthHeaders(): Record<string, string> {
  return API_KEY ? { "X-API-Key": API_KEY } : {};
}`;
            case 'basic':
                return `
const API_USERNAME = process.env.API_USERNAME || "";
const API_PASSWORD = process.env.API_PASSWORD || "";

function getAuthHeaders(): Record<string, string> {
  if (API_USERNAME && API_PASSWORD) {
    const credentials = Buffer.from(\`\${API_USERNAME}:\${API_PASSWORD}\`).toString('base64');
    return { Authorization: \`Basic \${credentials}\` };
  }
  return {};
}`;
            case 'bearer':
            default:
                return `
const API_KEY = process.env.API_KEY || "";

function getAuthHeaders(): Record<string, string> {
  return API_KEY ? { Authorization: \`Bearer \${API_KEY}\` } : {};
}`;
        }
    }

    private generateReadme(zip: JSZip, spec: any, language: 'typescript' | 'python', opts: GenerationOptions): void {
        const serverName = opts.serverName || (spec.info?.title || 'MCP Server').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const tools = this.extractTools(spec);
        const baseUrl = this.getBaseUrl(spec, opts);

        const authEnvVars = opts.authType === 'basic' 
            ? '- `API_USERNAME`: Username for basic auth\n- `API_PASSWORD`: Password for basic auth'
            : opts.authType === 'none' 
                ? ''
                : '- `API_KEY`: API key for authentication';

        const installCmd = language === 'typescript' ? 'npm install && npm run build' : 'pip install -e .';
        const runCmd = language === 'typescript' ? 'node dist/index.js' : 'python -m src.server';
        const testUICmd = language === 'typescript' 
            ? 'npm run test-ui'
            : 'python test-ui/server.py';
        
        const configExample = language === 'typescript' 
            ? `{
  "mcpServers": {
    "${serverName}": {
      "command": "node",
      "args": ["${opts.serverName ? `path/to/${serverName}` : 'path/to/server'}/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}`
            : `{
  "mcpServers": {
    "${serverName}": {
      "command": "python",
      "args": ["-m", "src.server"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}`;

        const testUISection = opts.includeTestUI ? `
## Test UI

A web-based interface is included for testing API endpoints directly.

### Running the Test UI

\`\`\`bash
${testUICmd}
\`\`\`

Then open http://localhost:3001 in your browser.

### Configuration

Set these environment variables to customize the test server:
- \`TEST_UI_PORT\`: Port for the test UI server (default: 3001)
- \`API_BASE_URL\`: Override the API base URL

The test UI allows you to:
- View all available API endpoints
- Fill in parameters with a user-friendly form
- Execute requests and see responses in real-time
- Configure API keys and custom base URLs
` : '';

        const content = `# ${spec.info?.title || 'MCP Server'}

${spec.info?.description || 'Generated MCP Server from OpenAPI specification.'}

## Installation

\`\`\`bash
${installCmd}
\`\`\`

## Configuration

Set environment variables:
- \`API_BASE_URL\`: Override the default API base URL (default: ${baseUrl})
${authEnvVars}

## Usage

### With Claude Desktop

Add to your \`claude_desktop_config.json\`:

\`\`\`json
${configExample}
\`\`\`

### Standalone

\`\`\`bash
${runCmd}
\`\`\`
${testUISection}
## Available Tools

${tools.map(t => `### ${t.name}
${t.description}
- **Method**: ${t.method}
- **Path**: ${t.path}
`).join('\n')}
`;
        zip.file('README.md', content);
    }

    private generateDockerfile(zip: JSZip, language: 'typescript' | 'python', opts: GenerationOptions): void {
        if (language === 'typescript') {
            zip.file('Dockerfile', `# Multi-stage build for TypeScript MCP Server
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --only=production

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
`);
        } else {
            zip.file('Dockerfile', `# Python MCP Server
FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml ./
COPY src ./src

RUN pip install --no-cache-dir -e .

ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "src.server"]
`);
        }
    }

    private generateGitHubActions(zip: JSZip, language: 'typescript' | 'python', opts: GenerationOptions): void {
        const serverName = opts.serverName || 'mcp-server';

        if (language === 'typescript') {
            zip.file('.github/workflows/build.yml', `name: Build and Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${serverName}-dist
          path: dist/
`);
        } else {
            zip.file('.github/workflows/build.yml', `name: Build and Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install --upgrade pip
          pip install -e .
      
      - name: Check syntax
        run: python -m py_compile src/server.py
`);
        }
    }

    private generateGitLabCI(zip: JSZip, language: 'typescript' | 'python', opts: GenerationOptions): void {
        if (language === 'typescript') {
            zip.file('.gitlab-ci.yml', `stages:
  - build
  - test

variables:
  NODE_VERSION: "20"

build:
  stage: build
  image: node:\${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

lint:
  stage: test
  image: node:\${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm run build
  needs: []
`);
        } else {
            zip.file('.gitlab-ci.yml', `stages:
  - build
  - test

variables:
  PYTHON_VERSION: "3.11"

build:
  stage: build
  image: python:\${PYTHON_VERSION}-slim
  script:
    - pip install -e .
    - python -m py_compile src/server.py

lint:
  stage: test
  image: python:\${PYTHON_VERSION}-slim
  script:
    - pip install ruff
    - ruff check src/
  allow_failure: true
`);
        }
    }

    private generateTestUI(zip: JSZip, spec: any, language: 'typescript' | 'python', opts: GenerationOptions): void {
        const tools = this.extractTools(spec);
        const baseUrl = this.getBaseUrl(spec, opts);
        const serverName = opts.serverName || spec.info?.title || 'MCP Server';

        // Generate the test UI HTML
        const html = this.generateTestUIHtml(tools, spec, serverName);
        zip.file('test-ui/index.html', html);

        // Generate the test server for TypeScript
        if (language === 'typescript') {
            this.generateTestServerTs(zip, tools, baseUrl, opts);
        } else {
            this.generateTestServerPy(zip, tools, baseUrl, opts);
        }
    }

    private generateTestUIHtml(tools: ToolDefinition[], spec: any, serverName: string): string {
        const toolCards = tools.map((t, idx) => {
            const fields = Object.entries(t.inputSchema.properties || {}).map(([name, schema]: [string, any]) => {
                const isRequired = t.inputSchema.required?.includes(name);
                const fieldType = schema.type === 'object' ? 'textarea' : 'input';
                const inputType = schema.type === 'integer' || schema.type === 'number' ? 'number' : 'text';
                
                if (schema.type === 'object') {
                    return `
                        <div class="field">
                            <label for="${t.name}-${name}">${name}${isRequired ? ' *' : ''}</label>
                            <textarea 
                                id="${t.name}-${name}" 
                                name="${name}" 
                                placeholder='${schema.description || (schema.properties ? JSON.stringify(Object.fromEntries(Object.keys(schema.properties).map(k => [k, ''])), null, 2) : '{}')}'
                                ${isRequired ? 'required' : ''}
                            ></textarea>
                            <span class="hint">${schema.description || 'JSON object'}</span>
                        </div>`;
                }
                
                return `
                        <div class="field">
                            <label for="${t.name}-${name}">${name}${isRequired ? ' *' : ''}</label>
                            <input 
                                type="${inputType}" 
                                id="${t.name}-${name}" 
                                name="${name}" 
                                placeholder="${schema.description || name}"
                                ${isRequired ? 'required' : ''}
                            />
                            <span class="hint">${schema.description || ''}</span>
                        </div>`;
            }).join('');

            return `
                <div class="tool-card" id="tool-${idx}">
                    <div class="tool-header" onclick="toggleTool(${idx})">
                        <div class="tool-info">
                            <span class="method method-${t.method.toLowerCase()}">${t.method}</span>
                            <span class="tool-name">${t.name}</span>
                        </div>
                        <span class="tool-path">${t.path}</span>
                        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <div class="tool-content">
                        <p class="description">${t.description}</p>
                        <form class="tool-form" onsubmit="executeTool(event, '${t.name}')">
                            ${fields || '<p class="no-params">No parameters required</p>'}
                            <button type="submit" class="execute-btn">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Execute
                            </button>
                        </form>
                        <div class="response-container" id="response-${t.name}" style="display: none;">
                            <div class="response-header">
                                <span>Response</span>
                                <span class="response-status" id="status-${t.name}"></span>
                            </div>
                            <pre class="response-body" id="body-${t.name}"></pre>
                        </div>
                    </div>
                </div>`;
        }).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${serverName} - Test UI</title>
    <style>
        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-card: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent: #3b82f6;
            --accent-hover: #2563eb;
            --success: #22c55e;
            --error: #ef4444;
            --warning: #f59e0b;
            --border: #475569;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border);
        }
        
        h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--accent), #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        header p {
            color: var(--text-secondary);
        }
        
        .config-bar {
            background: var(--bg-secondary);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .config-bar label {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
        
        .config-bar input {
            flex: 1;
            min-width: 200px;
            padding: 0.5rem 0.75rem;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text-primary);
            font-size: 0.875rem;
        }
        
        .config-bar input:focus {
            outline: none;
            border-color: var(--accent);
        }
        
        .tool-card {
            background: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
            border: 1px solid var(--border);
        }
        
        .tool-header {
            padding: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: background 0.2s;
        }
        
        .tool-header:hover {
            background: var(--bg-card);
        }
        
        .tool-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .method {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .method-get { background: #22c55e33; color: #22c55e; }
        .method-post { background: #3b82f633; color: #3b82f6; }
        .method-put { background: #f59e0b33; color: #f59e0b; }
        .method-patch { background: #8b5cf633; color: #8b5cf6; }
        .method-delete { background: #ef444433; color: #ef4444; }
        
        .tool-name {
            font-weight: 600;
        }
        
        .tool-path {
            color: var(--text-secondary);
            font-family: monospace;
            font-size: 0.875rem;
            margin-left: auto;
        }
        
        .chevron {
            width: 20px;
            height: 20px;
            color: var(--text-secondary);
            transition: transform 0.2s;
        }
        
        .tool-card.expanded .chevron {
            transform: rotate(180deg);
        }
        
        .tool-content {
            display: none;
            padding: 1rem;
            border-top: 1px solid var(--border);
            background: var(--bg-card);
        }
        
        .tool-card.expanded .tool-content {
            display: block;
        }
        
        .description {
            color: var(--text-secondary);
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }
        
        .field {
            margin-bottom: 1rem;
        }
        
        .field label {
            display: block;
            margin-bottom: 0.25rem;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .field input, .field textarea {
            width: 100%;
            padding: 0.5rem 0.75rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text-primary);
            font-size: 0.875rem;
            font-family: inherit;
        }
        
        .field textarea {
            min-height: 100px;
            font-family: monospace;
            resize: vertical;
        }
        
        .field input:focus, .field textarea:focus {
            outline: none;
            border-color: var(--accent);
        }
        
        .hint {
            display: block;
            margin-top: 0.25rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
        
        .no-params {
            color: var(--text-secondary);
            font-style: italic;
        }
        
        .execute-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 1.25rem;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .execute-btn:hover {
            background: var(--accent-hover);
        }
        
        .execute-btn:disabled {
            background: var(--border);
            cursor: not-allowed;
        }
        
        .execute-btn svg {
            width: 16px;
            height: 16px;
        }
        
        .response-container {
            margin-top: 1rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            overflow: hidden;
        }
        
        .response-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0.75rem;
            background: var(--bg-secondary);
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .response-status {
            padding: 0.125rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
        }
        
        .response-status.success { background: #22c55e33; color: #22c55e; }
        .response-status.error { background: #ef444433; color: #ef4444; }
        
        .response-body {
            padding: 1rem;
            margin: 0;
            background: var(--bg-primary);
            font-family: monospace;
            font-size: 0.8rem;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }
        
        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top-color: currentColor;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
            .container { padding: 1rem; }
            .tool-header { flex-wrap: wrap; }
            .tool-path { width: 100%; margin-left: 0; margin-top: 0.5rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${serverName}</h1>
            <p>Endpoint Test UI - ${spec.info?.version || '1.0.0'}</p>
        </header>
        
        <div class="config-bar">
            <label for="api-key">API Key:</label>
            <input type="password" id="api-key" placeholder="Enter your API key (optional)" />
            <label for="base-url">Base URL:</label>
            <input type="text" id="base-url" value="http://localhost:3001" placeholder="API proxy URL" />
        </div>
        
        <div class="tools-list">
            ${toolCards}
        </div>
    </div>
    
    <script>
        function toggleTool(idx) {
            const card = document.getElementById('tool-' + idx);
            card.classList.toggle('expanded');
        }
        
        async function executeTool(event, toolName) {
            event.preventDefault();
            const form = event.target;
            const btn = form.querySelector('.execute-btn');
            const responseContainer = document.getElementById('response-' + toolName);
            const statusEl = document.getElementById('status-' + toolName);
            const bodyEl = document.getElementById('body-' + toolName);
            
            // Collect form data
            const formData = new FormData(form);
            const args = {};
            for (const [key, value] of formData.entries()) {
                if (value) {
                    // Try to parse as JSON for object fields
                    try {
                        const parsed = JSON.parse(value);
                        args[key] = parsed;
                    } catch {
                        args[key] = value;
                    }
                }
            }
            
            // Get config
            const apiKey = document.getElementById('api-key').value;
            const baseUrl = document.getElementById('base-url').value;
            
            // Disable button and show loading
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> Executing...';
            
            try {
                const response = await fetch(baseUrl + '/api/call', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(apiKey ? { 'X-API-Key': apiKey } : {})
                    },
                    body: JSON.stringify({ tool: toolName, arguments: args })
                });
                
                const data = await response.json();
                
                responseContainer.style.display = 'block';
                statusEl.className = 'response-status ' + (response.ok ? 'success' : 'error');
                statusEl.textContent = response.ok ? 'Success ' + response.status : 'Error ' + response.status;
                bodyEl.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                responseContainer.style.display = 'block';
                statusEl.className = 'response-status error';
                statusEl.textContent = 'Error';
                bodyEl.textContent = 'Request failed: ' + error.message;
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
        
        // Expand first tool by default
        document.querySelector('.tool-card')?.classList.add('expanded');
    </script>
</body>
</html>`;
    }

    private generateTestServerTs(zip: JSZip, tools: ToolDefinition[], baseUrl: string, opts: GenerationOptions): void {
        const toolHandlers = tools.map(t => {
            // Build URL with path parameters
            let urlCode = `\`\${API_BASE_URL}${t.path}\``;
            if (t.pathParams.length > 0) {
                let pathExpr = t.path;
                for (const param of t.pathParams) {
                    pathExpr = pathExpr.replace(`{${param}}`, `\${args?.${param} ?? ''}`);
                }
                urlCode = `\`\${API_BASE_URL}${pathExpr}\``;
            }

            const queryCode = t.queryParams.length > 0
                ? `params: { ${t.queryParams.map(p => `${p}: args?.${p}`).join(', ')} },`
                : '';
            const dataCode = t.hasBody ? `data: args?.body,` : '';

            return `
            case "${t.name}": {
                const response = await axios({
                    method: "${t.method}",
                    url: ${urlCode},
                    ${queryCode}
                    ${dataCode}
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(apiKey) },
                });
                result = response.data;
                break;
            }`;
        }).join('');

        const content = `/**
 * Test UI Server
 * Run this to test your API endpoints via a web interface
 * 
 * Usage: npm run test-ui
 * Then open http://localhost:3001 in your browser
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.TEST_UI_PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || "${baseUrl}";

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function getAuthHeaders(apiKey) {
    const headers = {};
    if (apiKey) {
        headers['Authorization'] = \`Bearer \${apiKey}\`;
    }
    return headers;
}

app.post('/api/call', async (req, res) => {
    const { tool, arguments: args } = req.body;
    const apiKey = req.headers['x-api-key'];

    try {
        let result;
        switch (tool) {${toolHandlers}
            default:
                return res.status(400).json({ error: \`Unknown tool: \${tool}\` });
        }
        res.json(result);
    } catch (error) {
        console.error('API call failed:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

app.listen(PORT, () => {
    console.log(\`\\n🧪 Test UI running at http://localhost:\${PORT}\`);
    console.log(\`📡 Proxying API calls to: \${API_BASE_URL}\\n\`);
});
`;

        zip.file('test-ui/server.js', content);
    }

    private generateTestServerPy(zip: JSZip, tools: ToolDefinition[], baseUrl: string, opts: GenerationOptions): void {
        const toolHandlers = tools.map(t => {
            // Build URL with path parameters
            let urlCode = `f"{API_BASE_URL}${t.path}"`;
            if (t.pathParams.length > 0) {
                let pathExpr = t.path;
                for (const param of t.pathParams) {
                    pathExpr = pathExpr.replace(`{${param}}`, `{args.get('${param}', '')}`);
                }
                urlCode = `f"{API_BASE_URL}${pathExpr}"`;
            }

            const queryCode = t.queryParams.length > 0
                ? `params = {${t.queryParams.map(p => `"${p}": args.get("${p}")`).join(', ')}}`
                : 'params = {}';
            
            // Only include json parameter for methods that support request body
            const methodLower = t.method.toLowerCase();
            const supportsBody = ['post', 'put', 'patch'].includes(methodLower);
            const httpCall = supportsBody && t.hasBody
                ? `httpx.${methodLower}(url, params=params, json=args.get("body"), headers=headers)`
                : `httpx.${methodLower}(url, params=params, headers=headers)`;

            return `
        elif tool == "${t.name}":
            ${queryCode}
            url = ${urlCode}
            response = ${httpCall}
            return response.json()`;
        }).join('');

        const content = `"""
Test UI Server
Run this to test your API endpoints via a web interface

Usage: python test-ui/server.py
Then open http://localhost:3001 in your browser
"""

import os
import json
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import httpx

PORT = int(os.environ.get("TEST_UI_PORT", 3001))
API_BASE_URL = os.environ.get("API_BASE_URL", "${baseUrl}")

class TestUIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)
    
    def do_POST(self):
        if self.path == "/api/call":
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length))
            
            tool = body.get("tool")
            args = body.get("arguments", {})
            api_key = self.headers.get("X-API-Key", "")
            
            headers = {}
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
            
            try:
                result = self.call_tool(tool, args, headers)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
        self.end_headers()
    
    def call_tool(self, tool: str, args: dict, headers: dict):
        if False:
            pass${toolHandlers}
        else:
            raise ValueError(f"Unknown tool: {tool}")


def main():
    server = HTTPServer(("", PORT), TestUIHandler)
    print(f"\\n🧪 Test UI running at http://localhost:{PORT}")
    print(f"📡 Proxying API calls to: {API_BASE_URL}\\n")
    server.serve_forever()


if __name__ == "__main__":
    main()
`;

        zip.file('test-ui/server.py', content);
    }
}
