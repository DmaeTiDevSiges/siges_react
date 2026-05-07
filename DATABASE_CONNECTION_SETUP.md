# Database Connection Configuration

## Setup Instructions

To use the database export/restore scripts, you need to configure your database connection.

## Option 1: Add to `.env.local` (Recommended)

Add these lines to your `.env.local` file:

```bash
# Database Connection Configuration
# For local development (Docker)
VITE_SUPABASE_DB_HOST=localhost
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=postgres
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=your_password_here

# OR for self-hosted Supabase on VPS
# VITE_SUPABASE_DB_HOST=your-vps-ip-or-domain
# VITE_SUPABASE_DB_PORT=5432
# VITE_SUPABASE_DB_NAME=postgres
# VITE_SUPABASE_DB_USER=postgres
# VITE_SUPABASE_DB_PASSWORD=your_password
```

## Option 2: Use Separate Environment Variables

Create dedicated database variables (these override VITE_ prefixed ones):

```bash
SUPABASE_DB_HOST=localhost
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_password
```

## Option 3: Command Line Arguments

Pass credentials directly when running commands:

```bash
# Export
node scripts/export-database-structure.js --host localhost --database postgres --user postgres

# Restore  
node scripts/restore-database.js --host localhost --database siges --user postgres --password mypass
```

## For Docker/Self-Hosted Supabase

If you're running Supabase in Docker on the same machine:

```bash
VITE_SUPABASE_DB_HOST=localhost
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=postgres
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=postgres  # Default Docker password
```

## For Remote VPS

If your Supabase is on a remote VPS:

```bash
VITE_SUPABASE_DB_HOST=your-vps-ip.example.com
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=postgres
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=your_secure_password
```

**Important:** Make sure port 5432 is open on your VPS firewall!

## Testing Connection

After configuring, test the connection:

```bash
npm run db:export
```

Expected output:
```
Database Configuration:
  Host: localhost
  Port: 5432
  Database: postgres
  User: postgres

╔═══════════════════════════════════════════════╗
║   Database Structure Export                   ║
╚═══════════════════════════════════════════════╝

📡 Connecting to database...
✅ Connected successfully
...
```

## Troubleshooting

### Error: getaddrinfo ENOTFOUND supabase_db

**Cause:** Script trying to connect to Docker hostname from outside Docker

**Solution:** Set host to `localhost` or your actual database host:
```bash
VITE_SUPABASE_DB_HOST=localhost
```

### Error: Connection refused

**Possible causes:**
1. Database not running
2. Wrong port
3. Firewall blocking connection

**Solutions:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Or for local installation
pg_isready -h localhost -p 5432

# Test connection manually
psql -h localhost -U postgres -c "SELECT 1"
```

### Error: Password authentication failed

**Solution:** Verify password in environment variables matches your database password

```bash
# Test with psql
psql -h localhost -U postgres
# Enter password when prompted
```

## Security Notes

⚠️ **Never commit database passwords to Git!**

1. Add `.env.local` to `.gitignore`
2. Use `.env.example` as template without real passwords
3. For production, use secure secret management (AWS Secrets Manager, etc.)

Example `.env.example`:
```bash
# Copy this to .env.local and fill in real values
VITE_SUPABASE_DB_HOST=localhost
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=postgres
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=changeme
```

## Quick Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database hostname | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `postgres` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |

## Example Configurations

### Local Development (Docker Desktop)

```bash
VITE_SUPABASE_DB_HOST=localhost
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=postgres
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=postgres
```

### Production (Remote VPS)

```bash
VITE_SUPABASE_DB_HOST=vps.supabase.siges-app.com.br
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=postgres
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=your_production_password
```

### Staging Environment

```bash
VITE_SUPABASE_DB_HOST=staging-db.example.com
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=siges_staging
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=staging_password
```

---

For more details, see:
- [DATABASE_BACKUP_GUIDE.md](DATABASE_BACKUP_GUIDE.md)
- [DATABASE_BACKUP_RESUMO.md](DATABASE_BACKUP_RESUMO.md)
