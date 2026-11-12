#!/usr/bin/env bash
# Consulta SOMENTE LEITURA no banco (diagnóstico pelo Claude Code / terminal).
#
#   dev/scripts/db-readonly.sh "select ... from ... limit 10"
#
# A sessão abre com default_transaction_read_only=on: qualquer INSERT/UPDATE/DELETE/
# DDL falha com "cannot execute ... in a read-only transaction". Também bloqueia
# múltiplos comandos (só um SELECT/WITH/EXPLAIN por chamada) e limita o tempo.
set -euo pipefail

cd "$(dirname "$0")/../.."
[ -f .env.local ] || { echo "Falta .env.local" >&2; exit 1; }
# Só a variável necessária (o .env.local tem linhas que o bash não carrega).
# Prefere o usuário somente leitura (dev/supabase/create_readonly_role_claude_ro.sql).
env_get() { grep -E "^$1=" .env.local | tail -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//'; }
DB_URL="$(env_get SUPABASE_DB_RO_URL)"
[ -n "$DB_URL" ] || DB_URL="$(env_get SUPABASE_DB_URL)"
[ -n "$DB_URL" ] || { echo "Defina SUPABASE_DB_RO_URL (ou SUPABASE_DB_URL) no .env.local" >&2; exit 1; }

sql="${1:-}"
[ -n "$sql" ] || { echo "Uso: $0 \"select ...\"" >&2; exit 1; }

# Só leitura: começa com SELECT/WITH/EXPLAIN e sem ';' no meio (um comando só).
trimmed="$(printf '%s' "$sql" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:];]*$//')"
if ! printf '%s' "$trimmed" | grep -qiE '^(select|with|explain)[[:space:]]'; then
    echo "Recusado: só SELECT / WITH / EXPLAIN." >&2; exit 2
fi
if printf '%s' "$trimmed" | grep -q ';'; then
    echo "Recusado: um comando por chamada (sem ';')." >&2; exit 2
fi
if printf '%s' "$trimmed" | grep -qiE '^explain[[:space:]].*analyze'; then
    echo "Recusado: EXPLAIN ANALYZE executa a consulta; use EXPLAIN simples." >&2; exit 2
fi

PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=15000" \
    psql "$DB_URL" -X -v ON_ERROR_STOP=1 -P pager=off -c "$trimmed"
