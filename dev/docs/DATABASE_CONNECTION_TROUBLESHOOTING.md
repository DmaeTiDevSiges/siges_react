# Database Connection Troubleshooting

## Current Status

✅ Scripts configured correctly  
✅ Environment variables set  
❌ Connection refused on port 5432

## Problem

The connection to `vps.supabase.siges-app.com.br:5432` is being refused. This typically means:

1. **Port 5432 is blocked by firewall** (most likely)
2. PostgreSQL is not listening on external connections
3. Wrong port number
4. Database server not running

## Solutions

### Option 1: Check VPS Firewall/Security Group

Your VPS provider may block port 5432 by default.

**To fix:**
1. Access your VPS control panel
2. Open port 5432 for PostgreSQL
3. Or add your IP to allowed IPs

**For Cloudflare/Supabase:**
- Check security group settings
- Ensure database accepts external connections

---

### Option 2: Use SSH Tunnel (Recommended for Security)

Instead of exposing port 5432 publicly, use SSH tunneling:

```bash
# Create SSH tunnel (run this in a separate terminal)
ssh -L 5432:localhost:5432 user@vps.supabase.siges-app.com.br

# Then update .env.local to use localhost
SUPABASE_DB_HOST=localhost
SUPABASE_DB_PORT=5432
```

**Benefits:**
- ✅ More secure (no public port exposure)
- ✅ Encrypted connection
- ✅ Bypasses firewall restrictions

---

### Option 3: Check if Port is Different

Your database might run on a non-standard port.

**Check on VPS:**
```bash
# SSH into VPS
ssh user@vps.supabase.siges-app.com.br

# Check PostgreSQL port
docker ps | grep postgres
# or
netstat -tlnp | grep 5432
```

If it's running on a different port (e.g., 5433), update `.env.local`:
```bash
SUPABASE_DB_PORT=5433  # Change to actual port
```

---

### Option 4: Enable Remote Connections on PostgreSQL

If you have SSH access to the VPS:

**1. Edit pg_hba.conf:**
```bash
# On VPS
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add this line:
host    all             all             0.0.0.0/0               md5
```

**2. Edit postgresql.conf:**
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf

# Change:
listen_addresses = '*'
```

**3. Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

⚠️ **Warning:** This exposes your database publicly. Use only with strong passwords and firewall rules!

---

### Option 5: Use Supabase REST API Instead

Since direct DB connection isn't available, we can export structure via REST API.

Let me create an alternative script that uses the REST API instead of direct PostgreSQL connection.

Would you like me to create this?

---

## Quick Test

Test if port is accessible:

```bash
# From your local machine
telnet vps.supabase.siges-app.com.br 5432

# Or
nc -zv vps.supabase.siges-app.com.br 5432
```

If connection fails, the port is blocked or service is not running.

---

## Recommended Next Steps

1. **Try SSH tunnel** (Option 2) - Most secure and reliable
2. **Check VPS firewall settings** - Open port 5432
3. **Contact VPS provider** - Ask about PostgreSQL remote access
4. **Use REST API export** - I can create alternative scripts

Which option would you like to pursue?
