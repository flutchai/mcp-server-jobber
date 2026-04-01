import type { ToolDefinition } from "../types.js";

export const clientTools: ToolDefinition[] = [
  {
    name: "list_clients",
    description:
      "List clients in Jobber with optional search. Returns paginated results with contact details.",
    inputSchema: {
      type: "object",
      properties: {
        first: {
          type: "number",
          description: "Number of clients to return (default 20, max 100)",
        },
        after: {
          type: "string",
          description: "Cursor for pagination (from previous pageInfo.endCursor)",
        },
        searchTerm: {
          type: "string",
          description: "Search by name, email, phone, or company",
        },
      },
    },
    handler: async (client, args) => {
      const { first = 20, after, searchTerm } = args;
      const search = searchTerm ? `, searchTerm: "${searchTerm}"` : "";
      const afterParam = after ? `, after: "${after}"` : "";

      const data = await client.query(`
        query {
          clients(first: ${first}${afterParam}${search}) {
            nodes {
              id
              firstName
              lastName
              companyName
              emails { address primary }
              phones { number primary }
              billingAddress { street1 street2 city province postalCode }
            }
            pageInfo { endCursor hasNextPage }
            totalCount
          }
        }
      `);

      return JSON.stringify(data.clients, null, 2);
    },
  },

  {
    name: "get_client",
    description: "Get detailed information about a specific Jobber client by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Client ID" },
      },
      required: ["id"],
    },
    handler: async (client, args) => {
      const data = await client.query(`
        query {
          client(id: "${args.id}") {
            id
            firstName
            lastName
            companyName
            emails { address primary description }
            phones { number primary description }
            billingAddress { street1 street2 city province postalCode country }
            properties {
              nodes {
                id
                address { street1 street2 city province postalCode }
              }
            }
            customFields { label value }
          }
        }
      `);

      return JSON.stringify(data.client, null, 2);
    },
  },

  {
    name: "create_client",
    description: "Create a new client in Jobber. Returns the created client or validation errors.",
    inputSchema: {
      type: "object",
      properties: {
        firstName: { type: "string", description: "Client first name" },
        lastName: { type: "string", description: "Client last name" },
        companyName: { type: "string", description: "Company name" },
        email: { type: "string", description: "Primary email address" },
        phone: { type: "string", description: "Primary phone number" },
      },
      required: ["firstName", "lastName"],
    },
    handler: async (client, args) => {
      const { firstName, lastName, companyName, email, phone } = args;

      const input: Record<string, any> = { firstName, lastName };
      if (companyName) input.companyName = companyName;
      if (email) {
        input.emails = [{ address: email, description: "MAIN", primary: true }];
      }
      if (phone) {
        input.phones = [{ number: phone, description: "MAIN", primary: true }];
      }

      const data = await client.mutate(
        `
        mutation CreateClient($input: ClientCreateInput!) {
          clientCreate(input: $input) {
            client {
              id
              firstName
              lastName
              companyName
              emails { address }
              phones { number }
            }
            userErrors { message path }
          }
        }
      `,
        { input },
      );

      return JSON.stringify(data.clientCreate, null, 2);
    },
  },

  {
    name: "upsert_client",
    description:
      "Find a client by email or phone; create if not found. Returns the existing or newly created client.",
    inputSchema: {
      type: "object",
      properties: {
        firstName: { type: "string", description: "Client first name" },
        lastName: { type: "string", description: "Client last name" },
        companyName: { type: "string", description: "Company name" },
        email: { type: "string", description: "Email to search by and set on create" },
        phone: { type: "string", description: "Phone to search by and set on create" },
      },
      required: ["firstName"],
    },
    handler: async (client, args) => {
      const { firstName, lastName, companyName, email, phone } = args;
      console.error(
        `[upsert_client] args: firstName=${firstName}, lastName=${lastName}, email=${email}, phone=${phone}, companyName=${companyName}`,
      );

      // 1. Search by email or phone
      const searchTerm = email || phone;
      if (searchTerm) {
        console.error(`[upsert_client] Searching by searchTerm="${searchTerm}"`);
        const searchData = await client.query(`
          query {
            clients(first: 1, searchTerm: "${searchTerm}") {
              nodes {
                id
                firstName
                lastName
                companyName
                emails { address }
                phones { number }
              }
              totalCount
            }
          }
        `);

        console.error(
          `[upsert_client] Search result: totalCount=${searchData.clients?.totalCount}, nodes=${JSON.stringify(searchData.clients?.nodes)}`,
        );

        const existing = searchData.clients?.nodes?.[0];
        if (existing) {
          console.error(`[upsert_client] Found existing client id=${existing.id}`);
          return JSON.stringify({ action: "found", client: existing }, null, 2);
        }
      }

      // 2. Not found — create
      const input: Record<string, any> = { firstName, lastName: lastName || "" };
      if (companyName) input.companyName = companyName;
      if (email) {
        input.emails = [{ address: email, description: "MAIN", primary: true }];
      }
      if (phone) {
        input.phones = [{ number: phone, description: "MAIN", primary: true }];
      }

      console.error(`[upsert_client] Creating client with input: ${JSON.stringify(input)}`);

      const data = await client.mutate(
        `
        mutation CreateClient($input: ClientCreateInput!) {
          clientCreate(input: $input) {
            client {
              id
              firstName
              lastName
              companyName
              emails { address }
              phones { number }
            }
            userErrors { message path }
          }
        }
      `,
        { input },
      );

      if (data.clientCreate?.userErrors?.length) {
        console.error(
          `[upsert_client] Create errors: ${JSON.stringify(data.clientCreate.userErrors)}`,
        );
        return JSON.stringify({ action: "error", errors: data.clientCreate.userErrors }, null, 2);
      }

      console.error(`[upsert_client] Created client id=${data.clientCreate?.client?.id}`);
      return JSON.stringify({ action: "created", client: data.clientCreate?.client }, null, 2);
    },
  },

  {
    name: "update_client",
    description: "Update an existing client in Jobber. Only provided fields are updated.",
    inputSchema: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "Client ID to update" },
        firstName: { type: "string", description: "New first name" },
        lastName: { type: "string", description: "New last name" },
        companyName: { type: "string", description: "New company name" },
        email: { type: "string", description: "New primary email" },
        phone: { type: "string", description: "New primary phone" },
      },
      required: ["clientId"],
    },
    handler: async (client, args) => {
      const { clientId, firstName, lastName, companyName, email, phone } = args;

      const input: Record<string, any> = {};
      if (firstName) input.firstName = firstName;
      if (lastName) input.lastName = lastName;
      if (companyName) input.companyName = companyName;
      if (email) {
        input.emails = [{ address: email, description: "MAIN", primary: true }];
      }
      if (phone) {
        input.phones = [{ number: phone, description: "MAIN", primary: true }];
      }

      const data = await client.mutate(
        `
        mutation UpdateClient($clientId: EncodedId!, $input: ClientUpdateInput!) {
          clientUpdate(clientId: $clientId, input: $input) {
            client {
              id
              firstName
              lastName
              companyName
              emails { address }
              phones { number }
            }
            userErrors { message path }
          }
        }
      `,
        { clientId, input },
      );

      return JSON.stringify(data.clientUpdate, null, 2);
    },
  },
];
