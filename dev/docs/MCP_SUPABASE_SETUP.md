# MCP Supabase Server Configuration - Self-Hosted VPS

## Overview
This guide explains how to configure and use the MCP (Model Context Protocol) server for your self-hosted Supabase instance on VPS.

## Current Configuration

### Environment Variables
Your Supabase instance is configured with:
- **URL**: `https://vps.supabase.siges-app.com.br/`
- **Anon Key**: Configured in `.env.local`
- **Database URL**: `postgresql://postgres:***@supabase_db:5432/postgres`

### MCP Configuration Files
Updated configurations for both IDEs:
- `.qoder/mcp.json` - Qoder IDE configuration
- `.cursor/mcp.json` - Cursor IDE configuration

## Setup Instructions

### 1. Prerequisites

Ensure you have:
- Node.js 18+ installed
- npm or pnpm package manager
- Access to your self-hosted Supabase instance
- Service role key from your Supabase dashboard

### 2. Get Your Service Role Key

⚠️ **Important**: You need to add your Supabase Service Role Key to use the MCP server fully.

To get your service role key:
1. Access your Supabase dashboard at `https://vps.supabase.siges-app.com.br/`
2. Go to **Settings** → **API**
3. Copy the `service_role` key (not the anon/public key)

Then add it to your `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Install MCP Server

The MCP server will be installed automatically when your IDE starts, but you can also install it manually:

```bash
npx -y @anthropic/mcp-server-supabase
```

### 4. Configure Environment

Create or update `.env.local` with all required variables:

```bash
# Supabase Connection
VITE_SUPABASE_URL=https://vps.supabase.siges-app.com.br/
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_URL=postgresql://postgres:password@host:5432/postgres
```

### 5. Restart Your IDE

After configuring:
- **Qoder**: Restart the application
- **Cursor**: Reload window (Ctrl+Shift+P → "Developer: Reload Window")

## Available MCP Tools

Once connected, you can use these tools through your AI assistant:

### Database Operations
- `list_tables` - List all tables in public schema
- `list_extensions` - List enabled PostgreSQL extensions
- `query_database` - Execute SQL queries
- `get_database_stats` - View active connections and statistics

### Schema & Development
- `inspect_schema` - Get detailed table/column information
- `generate_types` - Generate TypeScript types from schema
- `apply_migration` - Apply SQL migrations

### Authentication Management
- `list_auth_users` - List all auth users
- `get_auth_user` - Get specific user details
- `create_user` - Create new auth user
- `update_user` - Update user metadata
- `delete_user` - Delete auth user

### Storage
- `list_buckets` - List storage buckets
- `list_objects` - List objects in a bucket

### Project Configuration
- `get_project_config` - Get project URLs and keys
- `verify_jwt_secret` - Verify JWT configuration

## Usage Examples

### Example 1: List All Tables
```
"List all tables in the public schema"
```

### Example 2: Query Database
```
"Show me the first 10 users from the users table"
```

### Example 3: Inspect Schema
```
"What columns does the v_orders table have?"
```

### Example 4: Generate Types
```
"Generate TypeScript types for all public schema tables"
```

### Example 5: Database Statistics
```
"How many active connections does the database have?"
```

## Troubleshooting

### Issue: MCP Server Not Starting

**Solution**: Check if `@anthropic/mcp-server-supabase` is installed:
```bash
npm list @anthropic/mcp-server-supabase
```

If not installed:
```bash
npm install -g @anthropic/mcp-server-supabase
```

### Issue: Permission Denied Errors

**Solution**: Ensure your service role key has proper permissions:
1. Verify the key in `.env.local`
2. Check database user has sufficient privileges
3. For self-hosted, ensure RLS policies allow access

### Issue: Cannot Connect to Database

**Solution**: Verify connection string:
```bash
# Test connection
psql postgresql://postgres:password@host:5432/postgres -c "SELECT 1"
```

Check firewall rules and ensure port 5432 is accessible from your VPS.

### Issue: Read-Only Mode

If you see `read_only=true` in the URL, some write operations will be disabled. Remove this parameter for full access.

## Security Best Practices

1. **Never commit service role keys** to version control
2. **Use environment variables** for sensitive data
3. **Restrict MCP access** to trusted networks only
4. **Enable read-only mode** for development environments
5. **Regularly rotate** API keys

## Self-Hosted Specific Notes

### Docker Network Configuration

If running Supabase in Docker, ensure the MCP server can reach the database:

```yaml
# In your docker-compose.yml
services:
  supabase-db:
    ports:
      - "5432:5432"  # Expose for local connections
```

### SSH Tunnel Access

For secure access from your development machine:

```bash
ssh -L 5432:localhost:5432 user@your-vps-ip
```

Then connect to `postgresql://postgres:password@localhost:5432/postgres`

### Kong API Gateway

If using Kong gateway (default with Supabase), ensure MCP endpoints are accessible:

```yaml
# config/kong.yml
- name: supabase-mcp
  url: http://kong:8001/mcp
  hosts:
    - vps.supabase.siges-app.com.br
```

## Testing the Connection

To verify MCP is working:

1. Ask your AI assistant: "Can you list all tables in the database?"
2. Expected response: A list of tables from the public schema
3. If successful, try: "What's the structure of the users table?"

## Additional Resources

- [Official Supabase MCP Docs](https://supabase.com/docs/guides/getting-started/mcp)
- [Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [MCP Server Repository](https://github.com/supabase/mcp-server-supabase)

## Support

For issues specific to self-hosted MCP:
1. Check container logs: `docker logs supabase-studio`
2. Verify API logs: `docker logs supabase-kong`
3. Review database connectivity: `docker logs supabase-db`

---

**Last Updated**: 2026-03-05
**Version**: 1.0.0
