# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-03-25

### Added

- Initial release of MCP server for Jobber
- Client management tools: `list_clients`, `get_client`, `create_client`, `update_client`
- Job management tools: `list_jobs`, `get_job`, `create_job`
- Quote management tools: `list_quotes`, `create_quote` with line items support
- Invoice management tools: `list_invoices`
- Jobber GraphQL API client with token resolution (env var or per-request)
- Pagination support for all list operations
- stdio transport for MCP communication
