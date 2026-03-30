import type { ToolDefinition } from "../types.js";

export const quoteTools: ToolDefinition[] = [
  {
    name: "list_quotes",
    description:
      "List quotes in Jobber with pagination. Returns quote details including client and status.",
    inputSchema: {
      type: "object",
      properties: {
        first: {
          type: "number",
          description: "Number of quotes to return (default 20, max 100)",
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
          quotes(first: ${first}${afterParam}) {
            nodes {
              id
              quoteNumber
              quoteStatus
              title
              message
              client { id firstName lastName companyName }
              amounts { depositAmount discountAmount outstanding subtotal total }
              createdAt
            }
            pageInfo { endCursor hasNextPage }
            totalCount
          }
        }
      `);

      return JSON.stringify(data.quotes, null, 2);
    },
  },

  {
    name: "create_quote",
    description:
      "Create a new quote in Jobber for a client. Optionally include line items.",
    inputSchema: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "Client ID to create the quote for" },
        title: { type: "string", description: "Quote title" },
        message: { type: "string", description: "Quote message/description" },
        lineItems: {
          type: "array",
          description: "Line items for the quote",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Item name" },
              description: { type: "string", description: "Item description" },
              quantity: { type: "number", description: "Quantity" },
              unitPrice: {
                type: "number",
                description: "Price per unit in cents (e.g. 5000 = $50.00)",
              },
            },
            required: ["name", "quantity", "unitPrice"],
          },
        },
      },
      required: ["clientId"],
    },
    handler: async (client, args) => {
      const { clientId, title, message, lineItems } = args;

      const input: Record<string, any> = { clientId };
      if (title) input.title = title;
      if (message) input.message = message;
      if (lineItems) input.lineItems = lineItems;

      const data = await client.mutate(`
        mutation CreateQuote($input: QuoteCreateInput!) {
          quoteCreate(input: $input) {
            quote {
              id
              quoteNumber
              quoteStatus
              title
              client { id firstName lastName }
              amounts { total }
            }
            userErrors { message path }
          }
        }
      `, { input });

      return JSON.stringify(data.quoteCreate, null, 2);
    },
  },
];
