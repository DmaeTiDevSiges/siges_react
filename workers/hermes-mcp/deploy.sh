#!/usr/bin/env bash
# Envia o servidor MCP do SIGES para a VPS (rodar no PC, de qualquer pasta).
# Uso: bash workers/hermes-mcp/deploy.sh [usuario@host]
set -euo pipefail

TARGET="${1:-root@169.58.40.214}"
DEST="/opt/siges-mcp"
cd "$(dirname "$0")"

echo ">> Enviando para $TARGET:$DEST ..."
tar czf - src package.json package-lock.json tsconfig.json env.example README.md \
  | ssh "$TARGET" "mkdir -p $DEST && tar xzf - -C $DEST && ls $DEST"
echo ">> OK. Agora, na VPS: cd $DEST && npm ci && npm run build"
