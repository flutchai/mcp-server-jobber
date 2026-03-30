import type { ToolDefinition } from "../types.js";

export const invoiceTools: ToolDefinition[] = [
  {
    name: "list_invoices",
    description:
      "List invoices in Jobber with pagination. Returns invoice details including client, amounts, and status.",
    inputSchema: {
      type: "object",
      properties: {
        first: {
          type: "number",
          description: "Number of invoices to return (default 20, max 100)",
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
          invoices(first: ${first}${afterParam}) {
            nodes {
              id
              invoiceNumber
              invoiceStatus
              subject
              client { id firstName lastName companyName }
              amounts { depositAmount discountAmount outstanding subtotal total }
              dueDate
              issuedDate
              createdAt
            }
            pageInfo { endCursor hasNextPage }
            totalCount
          }
        }
      `);

      return JSON.stringify(data.invoices, null, 2);
    },
  },
];
