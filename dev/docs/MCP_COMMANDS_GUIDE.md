# MCP Supabase Commands - Quick Reference Guide

## How to Use

Once your IDE is restarted with MCP configured, simply ask your AI assistant to perform database operations using natural language.

---

## Basic Commands (No Service Role Key Required)

### Query Database Tables

```
"List all tables in the public schema"
```

```
"What tables are available in my database?"
```

```
"Show me all tables I can access"
```

---

### Inspect Table Structure

```
"Show the structure of the users table"
```

```
"What columns does v_orders have?"
```

```
"Describe the assets table schema"
```

```
"Show me all columns and their types for orders_visits"
```

---

### Query Data

```
"Get the first 10 users from the database"
```

```
"Show me recent orders from v_orders"
```

```
"Count how many records are in each table"
```

```
"Find all users created in the last 30 days"
```

```
"Show me a sample of data from the assets table"
```

---

### Database Statistics

```
"How many active connections does the database have?"
```

```
"Show me database statistics"
```

```
"What's the size of my database?"
```

---

### Generate Code

```
"Generate TypeScript types for all my database tables"
```

```
"Create TypeScript interfaces for the users table"
```

```
"Generate a SQL query to join users with v_orders"
```

---

## Advanced Commands (Require Service Role Key)

### User Management

```
"List all auth users in the system"
```

```
"Create a new user with email test@example.com"
```

```
"Update user metadata for user ID 123"
```

```
"Delete the user with email spam@example.com"
```

---

### Storage Operations

```
"List all storage buckets"
```

```
"Show me objects in the 'avatars' bucket"
```

```
"Upload a file to the storage"
```

---

### Schema Management

```
"Apply this migration to the database"
```

```
"List all PostgreSQL extensions"
```

```
"Enable the uuid-ossp extension"
```

---

## Example Conversations

### Example 1: Exploring Your Database

**You:** "What tables are in my database?"

**AI:** "I found these tables in your public schema:
- users
- v_orders
- assets
- orders_visits
- cfg_assets_types"

**You:** "Show me the structure of v_orders"

**AI:** "The v_orders table has these columns:
- id (uuid)
- created_at (timestamp)
- status (text)
- user_id (uuid)
- ..."

---

### Example 2: Querying Data

**You:** "How many users do I have?"

**AI:** "Your database has 42 users."

**You:** "Show me the 5 most recent users"

**AI:** [Displays user data]

---

### Example 3: Development Workflow

**You:** "Generate TypeScript types for my database"

**AI:** [Generates complete TypeScript definitions]

**You:** "Now create a function to fetch users"

**AI:** [Creates typed function]

---

## Tips for Best Results

### ✅ Be Specific

Instead of: "Query the database"

Try: "Get all users where status equals 'active', limit to 20 results"

---

### ✅ Provide Context

Instead of: "Fix this error"

Try: "I'm getting a foreign key constraint error when inserting into orders_visits. Can you help?"

---

### ✅ Ask for Explanations

"Don't just show me the query, explain how it works"

---

### ✅ Request Multiple Formats

"Show me the data as JSON, then as a table, then generate a CSV export query"

---

## Common Use Cases

### 1. Debugging Issues

```
"Why am I getting a null value error in this query?"
```

```
"Check if there are any duplicate entries in users table"
```

```
"Find orphaned records in orders_visits"
```

---

### 2. Data Analysis

```
"Show me orders grouped by status"
```

```
"Calculate average order value per user"
```

```
"Find users who haven't placed any orders"
```

---

### 3. Schema Design

```
"Help me design a table for tracking order history"
```

```
"What indexes should I add to improve query performance?"
```

```
"Review my schema and suggest improvements"
```

---

### 4. Migration Help

```
"Convert this MySQL query to PostgreSQL syntax"
```

```
"Help me write a migration to add a new column"
```

```
"Generate rollback SQL for this change"
```

---

## Troubleshooting MCP Commands

### If Commands Don't Work

1. **Verify MCP is running:**
   - Check your IDE's MCP status
   - Look for Supabase in connected servers

2. **Test basic connectivity:**
   ```bash
   node test-mcp-connection.js
   ```

3. **Restart IDE:**
   - Qoder: Close and reopen
   - Cursor: Ctrl+Shift+P → "Developer: Reload Window"

---

### If You Get Permission Errors

**With Anon Key Only:**
- Some system tables may not be accessible
- Auth user management requires service role key
- Storage operations may be limited

**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

---

### If Queries Timeout

**Possible causes:**
- Large datasets
- Complex joins
- Network latency to VPS

**Solutions:**
- Add LIMIT clauses
- Use specific column selects instead of SELECT *
- Add WHERE clauses to filter data

---

## Security Reminders

⚠️ **Never ask the AI to:**
- Show you the service role key
- Delete production data without confirmation
- Expose sensitive credentials

✅ **Always:**
- Review generated SQL before executing
- Test destructive operations on staging first
- Use read-only mode for exploration

---

## Quick Command Cheatsheet

| Task | Example Command |
|------|----------------|
| List tables | "Show all tables" |
| Table structure | "Describe users table" |
| Sample data | "Get 5 rows from v_orders" |
| Count records | "Count users" |
| Search data | "Find users with status='active'" |
| Generate types | "Create TypeScript types" |
| SQL query | "Write a query to..." |
| Explain schema | "How are users and orders related?" |

---

## Next Steps

1. ✅ Start with simple queries to explore your database
2. ✅ Gradually try more complex operations
3. ✅ Use AI suggestions for optimization
4. ✅ Build reusable queries and functions
5. ✅ Document your findings

---

**Happy querying! 🚀**

For detailed setup information, see:
- `MCP_CONFIGURATION_SUMMARY.md`
- `MCP_SUPABASE_SETUP.md`
