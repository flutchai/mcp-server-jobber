import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { JobberClient } from "./jobber-client.js";
import { getAllTools } from "./tools/index.js";
import type { ToolDefinition } from "./types.js";

class JobberMcpServer {
  private server: Server;
  private tools: ToolDefinition[];
  private toolMap: Map<string, ToolDefinition>;

  constructor() {
    this.tools = getAllTools();
    this.toolMap = new Map(this.tools.map((t) => [t.name, t]));

    this.server = new Server(
      { name: "mcp-server-jobber", version: "0.1.0" },
      { capabilities: { tools: {} } },
    );

    this.setupHandlers();

    this.server.onerror = (error) =>
      console.error("[Jobber MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools.map(({ name, description, inputSchema }) => ({
        name,
        description,
        inputSchema,
      })),
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const { name, arguments: args = {} } = request.params;
        const tool = this.toolMap.get(name);

        if (!tool) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`,
          );
        }

        try {
          const token = JobberClient.resolveToken(args);
          const client = new JobberClient(token);

          // Strip internal params before passing to handler
          const { _token, ...cleanArgs } = args;
          const result = await tool.handler(client, cleanArgs);

          return { content: [{ type: "text", text: result }] };
        } catch (error: any) {
          if (error instanceof McpError) throw error;

          const status = error?.response?.status;
          if (status === 401) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              "Jobber access token is invalid or expired. Refresh the token and try again.",
            );
          }

          throw new McpError(
            ErrorCode.InternalError,
            `Jobber API error: ${error.message}`,
          );
        }
      },
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Jobber MCP Server running on stdio");
  }
}

const server = new JobberMcpServer();
server.run().catch(console.error);
