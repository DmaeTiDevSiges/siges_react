"""siges-identity — plugin do Hermes Agent.

Garante que as ferramentas do SIGES (servidor MCP "siges") saibam QUEM está
perguntando, sem depender do modelo de IA:

1. ``pre_llm_call`` (disparado pelo gateway a cada mensagem) recebe ``sender_id``
   e ``session_id``: guardamos sessão -> remetente.
2. ``pre_tool_call`` (antes de executar cada ferramenta): se a ferramenta for do
   SIGES, buscamos o remetente da sessão e gravamos em ``_siges_auth`` um token
   assinado com HMAC (SIGES_HOOK_SECRET), SOBRESCREVENDO o que o modelo tiver
   posto ali. Sem remetente conhecido, a chamada é BLOQUEADA.

O servidor siges-tools valida a assinatura e procura o usuário por users.mobile_full.
Token: v1.<remetente_base64url>.<unix_ts>.<hmac_sha256_hex de "v1.<b64>.<ts>">
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import os
import threading
import time
from pathlib import Path

logger = logging.getLogger("siges-identity")

# Nome do servidor em ~/.hermes/config.yaml (mcp_servers.siges) -> ferramentas "mcp__siges__*".
TOOL_PREFIX = os.environ.get("SIGES_TOOL_PREFIX", "mcp__siges__")
AUTH_ARG = "_siges_auth"
# O segredo fica no .env do servidor MCP (fonte única); a variável de ambiente tem prioridade.
MCP_ENV_FILE = Path(os.environ.get("SIGES_MCP_ENV_FILE", "/opt/siges-mcp/.env"))
SESSION_TTL_SECONDS = 24 * 3600

_lock = threading.Lock()
_senders: dict[str, tuple[str, float]] = {}  # session_id -> (sender_id, visto_em)


def _read_secret() -> str | None:
    secret = os.environ.get("SIGES_HOOK_SECRET")
    if secret:
        return secret.strip()
    try:
        for line in MCP_ENV_FILE.read_text(encoding="utf-8").splitlines():
            key, sep, value = line.partition("=")
            if sep and key.strip() == "SIGES_HOOK_SECRET":
                return value.strip().strip("'\"") or None
    except OSError as exc:
        logger.warning("siges-identity: não consegui ler %s: %s", MCP_ENV_FILE, exc)
    return None


def _sign(sender: str, secret: str) -> str:
    b64 = base64.urlsafe_b64encode(sender.encode("utf-8")).decode("ascii").rstrip("=")
    ts = str(int(time.time()))
    payload = f"v1.{b64}.{ts}"
    sig = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def _remember_sender(session_id=None, sender_id=None, platform=None, **kwargs):
    """pre_llm_call: observa o remetente da mensagem. Não injeta contexto (retorna None)."""
    if not session_id or not sender_id:
        return None
    now = time.time()
    with _lock:
        _senders[str(session_id)] = (str(sender_id), now)
        # limpeza simples de sessões antigas
        for sid in [s for s, (_, t) in _senders.items() if now - t > SESSION_TTL_SECONDS]:
            _senders.pop(sid, None)
    return None


def _lookup_sender(session_id, parent_session_id=None):
    with _lock:
        for sid in (session_id, parent_session_id):
            if sid and str(sid) in _senders:
                return _senders[str(sid)][0]
    return None


def _sign_siges_call(tool_name=None, args=None, session_id=None, parent_session_id=None, **kwargs):
    """pre_tool_call: injeta o remetente assinado nas ferramentas do SIGES."""
    if not tool_name or not str(tool_name).startswith(TOOL_PREFIX):
        return None

    sender = _lookup_sender(session_id, parent_session_id)
    if not sender:
        return {
            "action": "block",
            "message": "Consulta ao SIGES bloqueada: não foi possível identificar quem enviou a mensagem "
                       "(o SIGES só responde a conversas do WhatsApp de usuários cadastrados).",
        }

    secret = _read_secret()
    if not secret:
        return {"action": "block", "message": "Consulta ao SIGES bloqueada: SIGES_HOOK_SECRET não configurado."}

    new_args = dict(args or {})
    new_args[AUTH_ARG] = _sign(sender, secret)
    return {"action": "modify", "args": new_args}


def register(ctx):
    ctx.register_hook("pre_llm_call", _remember_sender)
    ctx.register_hook("pre_tool_call", _sign_siges_call)
    logger.info("siges-identity: hooks registrados (prefixo %s)", TOOL_PREFIX)
