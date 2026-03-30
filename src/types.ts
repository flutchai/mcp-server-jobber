/**
 * Tool definition for the Jobber MCP server.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (client: JobberGraphQLClient, args: Record<string, any>) => Promise<string>;
}

/**
 * Minimal interface for the GraphQL client used by tool handlers.
 */
export interface JobberGraphQLClient {
  query(query: string, variables?: Record<string, any>): Promise<any>;
  mutate(mutation: string, variables?: Record<string, any>): Promise<any>;
}
