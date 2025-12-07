# MCP Builder Gap Analysis

This document outlines the gaps between the current `swagger2mcp` implementation and the official Model Context Protocol (MCP) standards and best practices, based on the [official TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md).

## 1. High-Level API Usage (`McpServer` vs `Server`)

**Current Implementation:**
- Uses the low-level `Server` class from `@modelcontextprotocol/sdk/server/index.js`.
- Manually implements request handlers for `ListToolsRequestSchema` and `CallToolRequestSchema`.
- Uses a large `switch` statement to dispatch tool calls.

**Official Standard:**
- Recommends using the high-level `McpServer` class from `@modelcontextprotocol/sdk/server/mcp.js`.
- Uses `server.tool(...)` (or `registerTool` in older versions) to register tools individually.
- This approach is more modular, readable, and less error-prone than a monolithic switch statement.

**Recommendation:**
Refactor the generator to use `McpServer`. Each OpenAPI operation should be registered as a distinct tool using the high-level API.

## 2. Schema Definition with Zod

**Current Implementation:**
- Generates raw JSON Schema objects for tool inputs.
- Manually constructs the `inputSchema` property in the tool definition.

**Official Standard:**
- The high-level API integrates with [Zod](https://zod.dev/) for schema definition.
- `server.tool(name, schema, callback)` takes a Zod schema object.
- This provides runtime validation and type inference out of the box.

**Recommendation:**
Update the generator to map OpenAPI schemas to Zod definitions in the generated TypeScript code. This will require adding `zod` as a dependency in the generated `package.json`.

## 3. Transport Support (Stdio vs Streamable HTTP)

**Current Implementation:**
- Hardcodes `StdioServerTransport` in `src/index.ts`.
- This limits the server to being run as a subprocess (e.g., by Claude Desktop or VS Code).

**Official Standard:**
- Recommends **Streamable HTTP** (via SSE/POST) for remote servers or multi-node deployments.
- `stdio` is still supported and valid for local integrations, but is not the only option.
- Provides `createMcpExpressApp` for easy Express integration with DNS rebinding protection.

**Recommendation:**
Add a configuration option (e.g., `--transport=stdio|http`) to the generator.
- **Stdio**: Keep current behavior for local use.
- **HTTP**: Generate an Express app using `createMcpExpressApp` or `SSEServerTransport` for remote deployment.

## 4. Resources and Prompts

**Current Implementation:**
- Only generates **Tools** based on OpenAPI paths/operations.
- Ignores other MCP primitives like Resources and Prompts.

**Official Standard:**
- **Resources**: Should be used to expose read-only data (e.g., API documentation, static configs, or direct file access).
- **Prompts**: Reusable templates to help users interact with the model.

**Recommendation:**
- **Resources**: Could auto-generate resources for `GET` endpoints that return static configuration or documentation.
- **Prompts**: Allow users to define prompts in the UI or infer them from specific API patterns.

## 5. Error Handling and Logging

**Current Implementation:**
- Uses `console.error` for logging (which is correct for Stdio transport).
- Basic `try/catch` around API calls.

**Official Standard:**
- Emphasizes that for Stdio servers, **stdout must never be used for logging** as it corrupts the JSON-RPC protocol.
- Recommends structured logging libraries or strict adherence to `console.error` (stderr).

**Recommendation:**
Ensure the generated code strictly enforces stderr logging. Consider adding a lightweight logging utility in the generated code to prevent accidental stdout usage.

## 6. Type Safety and Code Structure

**Current Implementation:**
- Generates a single `index.ts` file which can become very large for big APIs.
- Types are often `any` or loosely defined in the generated code.

**Official Standard:**
- Encourages modularity.
- The SDK provides strong typing for tool arguments via Zod.

**Recommendation:**
- Split the generated code into multiple files (e.g., `tools/`, `types/`, `server.ts`) for larger specs.
- Leverage TypeScript interfaces generated from OpenAPI components for better type safety.

## Summary of Action Items

1.  **Upgrade to `McpServer`**: Rewrite `generateIndexTs` to use the high-level API.
2.  **Adopt Zod**: Integrate `zod` schema generation.
3.  **Add HTTP Transport**: Support generating an Express-based server.
4.  **Modularize Output**: Break down `index.ts` for maintainability.
