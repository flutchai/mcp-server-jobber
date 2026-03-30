# @flutchai/mcp-server-jobber

MCP server for [Jobber](https://getjobber.com) field service management — manage clients, jobs, quotes, and invoices via the Jobber GraphQL API.

## Features

- **Clients** — list, get, create, update clients
- **Jobs** — list, get, create jobs
- **Quotes** — list, create quotes with line items
- **Invoices** — list invoices with amounts and status

All tools support pagination and return structured JSON responses.

## Installation

```bash
npm install @flutchai/mcp-server-jobber
```

Or run directly:

```bash
npx @flutchai/mcp-server-jobber
```

## Configuration

The server requires a Jobber access token. There are two ways to provide it:

### Environment variable (OSS / dedicated process)

```bash
export JOBBER_ACCESS_TOKEN="your-jobber-access-token"
```

### Per-request token (Cloud / shared process)

Pass `_token` in the tool arguments for each call.

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jobber": {
      "command": "npx",
      "args": ["-y", "@flutchai/mcp-server-jobber"],
      "env": {
        "JOBBER_ACCESS_TOKEN": "your-jobber-access-token"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_clients` | List clients with optional search and pagination |
| `get_client` | Get detailed client info by ID |
| `create_client` | Create a new client |
| `update_client` | Update an existing client |
| `list_jobs` | List jobs with pagination |
| `get_job` | Get detailed job info by ID |
| `create_job` | Create a new job for a client |
| `list_quotes` | List quotes with pagination |
| `create_quote` | Create a quote with optional line items |
| `list_invoices` | List invoices with pagination |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run
npm start
```

## Requirements

- Node.js >= 18
- Jobber API access token ([Jobber Developer Portal](https://developer.getjobber.com))

## License

[MIT](LICENSE)
