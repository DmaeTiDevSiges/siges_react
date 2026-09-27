-- =============================================================================
-- Migration: Realtime — tenants com external_id = 1º rótulo do Host visto
-- Data: 2026-09-26
-- Aplicação: manual, no SQL Editor do Supabase (ver AGENTS.md)
-- =============================================================================
-- Contexto: o handshake do WebSocket estava sendo recusado com 403.
-- No código do realtime (RealtimeWeb.UserSocket.connect):
--     {:ok, external_id} = Database.get_external_id(host)   -- 1º rótulo do Host
--     Tenants.Cache.fetch_tenant_by_external_id(external_id)
-- Ou seja, o tenant precisa ter external_id igual ao 1º rótulo do Host que o
-- realtime enxerga. Hosts candidatos (Kong encaminha para o serviço realtime):
--   'realtime' = Host do upstream do Kong (preserve_host=false, url http://realtime:4000)
--   'vps'      = Host público preservado (vps.supabase.siges-app.com.br)
-- Hoje só existe 'realtime-dev' (seed SEED_SELF_HOST) em _realtime.tenants,
-- por isso o 403. A linha 'realtime' em public.tenants (2025-07-12) mostra que
-- esse id já foi necessário quando o realtime lia o schema público.
--
-- A cópia preserva o jwt_secret CIPHERTEXT (encriptado com DB_ENC_KEY) e a
-- extension postgres_cdc_rls (settings de conexão com o banco) do tenant seed.
-- Idempotente: só insere candidatos ainda inexistentes.
--
-- Depois de aplicar, testar o handshake/canais e remover os candidatos que
-- não forem usados (DELETE FROM _realtime.extensions WHERE tenant_external_id = '<id>';
-- DELETE FROM _realtime.tenants WHERE external_id = '<id>';).
-- =============================================================================

-- 1) Tenants candidatos (cópia de realtime-dev, só muda id/name/external_id)
INSERT INTO _realtime.tenants
SELECT (
        jsonb_populate_record(
            NULL::_realtime.tenants,
            to_jsonb(t) - 'id' - 'name' - 'external_id'
            || jsonb_build_object('id', gen_random_uuid(), 'name', c.eid, 'external_id', c.eid)
        )
       ).*
  FROM _realtime.tenants t
 CROSS JOIN (VALUES ('realtime'), ('vps')) AS c(eid)
 WHERE t.external_id = 'realtime-dev'
   AND NOT EXISTS (
        SELECT 1 FROM _realtime.tenants x WHERE x.external_id = c.eid
   );

-- 2) Extension postgres_cdc_rls de cada candidato (cópia da do seed)
INSERT INTO _realtime.extensions
SELECT (
        jsonb_populate_record(
            NULL::_realtime.extensions,
            to_jsonb(e) - 'id' - 'tenant_external_id'
            || jsonb_build_object('id', gen_random_uuid(), 'tenant_external_id', c.eid)
        )
       ).*
  FROM _realtime.extensions e
 CROSS JOIN (VALUES ('realtime'), ('vps')) AS c(eid)
 WHERE e.tenant_external_id = 'realtime-dev'
   AND e.type = 'postgres_cdc_rls'
   AND NOT EXISTS (
        SELECT 1 FROM _realtime.extensions x
         WHERE x.tenant_external_id = c.eid AND x.type = e.type
   );

-- 3) Verificação
SELECT t.external_id,
       t.name,
       t.suspend,
       e.type,
       e.settings ->> 'db_host'     AS db_host,
       e.settings ->> 'db_name'     AS db_name,
       e.settings ->> 'db_user'     AS db_user,
       e.settings ->> 'ssl_enforced' AS ssl_enforced
  FROM _realtime.tenants t
  LEFT JOIN _realtime.extensions e ON e.tenant_external_id = t.external_id
 ORDER BY t.external_id;
-- deve listar: realtime | realtime-dev | vps, cada um com a sua extension
