import type { ToolDefinition } from "../types.js";
import { clientTools } from "./clients.js";
import { jobTools } from "./jobs.js";
import { quoteTools } from "./quotes.js";
import { invoiceTools } from "./invoices.js";

export function getAllTools(): ToolDefinition[] {
  return [...clientTools, ...jobTools, ...quoteTools, ...invoiceTools];
}
