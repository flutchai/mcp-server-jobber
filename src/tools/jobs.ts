import type { ToolDefinition } from "../types.js";

export const jobTools: ToolDefinition[] = [
  {
    name: "list_jobs",
    description:
      "List jobs in Jobber with pagination. Returns job details including client and status.",
    inputSchema: {
      type: "object",
      properties: {
        first: {
          type: "number",
          description: "Number of jobs to return (default 20, max 100)",
        },
        after: {
          type: "string",
          description: "Cursor for pagination",
        },
      },
    },
    handler: async (client, args) => {
      const { first = 20, after } = args;
      const afterParam = after ? `, after: "${after}"` : "";

      const data = await client.query(`
        query {
          jobs(first: ${first}${afterParam}) {
            nodes {
              id
              jobNumber
              title
              jobStatus
              startAt
              endAt
              client { id firstName lastName companyName }
              property { id address { street1 city province } }
              total
            }
            pageInfo { endCursor hasNextPage }
            totalCount
          }
        }
      `);

      return JSON.stringify(data.jobs, null, 2);
    },
  },

  {
    name: "get_job",
    description: "Get detailed information about a specific job by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Job ID" },
      },
      required: ["id"],
    },
    handler: async (client, args) => {
      const data = await client.query(`
        query {
          job(id: "${args.id}") {
            id
            jobNumber
            title
            jobStatus
            instructions
            startAt
            endAt
            client { id firstName lastName companyName }
            property { id address { street1 street2 city province postalCode } }
            lineItems { nodes { name description quantity unitPrice totalPrice } }
            total
            customFields { label value }
          }
        }
      `);

      return JSON.stringify(data.job, null, 2);
    },
  },

  {
    name: "create_job",
    description: "Create a new job in Jobber. Requires a client ID and title.",
    inputSchema: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "Client ID to assign the job to" },
        title: { type: "string", description: "Job title" },
        description: { type: "string", description: "Job instructions/description" },
        startAt: {
          type: "string",
          description: "Start date/time in ISO 8601 format (e.g. 2024-03-15T09:00:00Z)",
        },
        endAt: {
          type: "string",
          description: "End date/time in ISO 8601 format",
        },
      },
      required: ["clientId", "title"],
    },
    handler: async (client, args) => {
      const { clientId, title, description, startAt, endAt } = args;

      const input: Record<string, any> = { clientId, title };
      if (description) input.instructions = description;
      if (startAt) input.startAt = startAt;
      if (endAt) input.endAt = endAt;

      const data = await client.mutate(
        `
        mutation CreateJob($input: JobCreateInput!) {
          jobCreate(input: $input) {
            job {
              id
              jobNumber
              title
              jobStatus
              startAt
              endAt
              client { id firstName lastName }
            }
            userErrors { message path }
          }
        }
      `,
        { input },
      );

      return JSON.stringify(data.jobCreate, null, 2);
    },
  },
];
