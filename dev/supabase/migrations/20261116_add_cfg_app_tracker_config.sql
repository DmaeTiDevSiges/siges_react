-- ==============================================================================
-- Migration: 20261116_add_cfg_app_tracker_config.sql
-- Intervalos do rastreamento de localização (app Android) configuráveis no banco,
-- sem precisar publicar um novo APK.
--
-- cfg_app.tracker_config (jsonb) — lido pelo app ao iniciar o rastreamento
-- (hooks/useLocationTracker.ts → LocationServicePlugin → LocationForegroundService).
-- Mudanças valem quando o app reinicia o rastreamento (abrir o app / ficar disponível).
--
-- Chaves (todas opcionais; ausentes usam o padrão do APK, igual aos valores abaixo):
--   min_send_interval_s          piso entre dois envios ao servidor (mín. 15)
--   still / foot / vehicle       por atividade detectada (parado / a pé / veículo):
--     gps_interval_s             intervalo desejado de leitura de posição
--     gps_min_interval_s         intervalo mínimo aceito do provedor
--     send_distance_m            envia ao andar esta distância
--     send_max_interval_s        envia no máximo a cada N s mesmo sem andar (heartbeat)
--     batch_s                    (veículo) junta posições por até N s antes de entregar (0 = desliga)
--     high_accuracy              (veículo) true = GPS de alta precisão (gasta mais bateria)
--   shift_only                   true = fora do expediente (users.shift_start/shift_end) e SEM
--                                visita aberta, o rastreamento pausa (visita aberta rastreia sempre)
--   shift_days                   dias do expediente, ISO: 1 = segunda ... 7 = domingo
--   shift_margin_min             tolerância antes do início e depois do fim do turno (min)
--   window_start / window_end    janela FIXA para todos ("HH:mm"); quando definida, substitui
--                                o turno individual (users.shift_start/shift_end)
--
-- Política definida em nov/2026: só LÍDERES DE EQUIPE (users.is_team_leader) são rastreados
-- (regra no app: hooks/useLocationTracker.ts); para eles, TODOS OS DIAS das 07:00 às 19:00
-- (sem tolerância) e, fora disso, só com visita aberta.
--
-- Valores padrão = recomendação de economia de bateria (nov/2026):
--   parado 5 min; a pé 30 s / 100 m / 3 min; veículo 15 s / 300 m / 2 min, lote de 60 s.
--
-- Aditiva e idempotente. Reverter:
--   ALTER TABLE public.cfg_app DROP COLUMN IF EXISTS tracker_config;
-- ==============================================================================

BEGIN;

ALTER TABLE public.cfg_app
    ADD COLUMN IF NOT EXISTS tracker_config jsonb;

COMMENT ON COLUMN public.cfg_app.tracker_config IS
    'Intervalos do rastreamento Android (ver migration 20261116_add_cfg_app_tracker_config.sql). NULL/ausente = padrão do APK.';

-- Padrões || valor atual: completa chaves ausentes sem sobrescrever ajustes já feitos.
UPDATE public.cfg_app
   SET tracker_config = '{
         "shift_only": true,
         "shift_days": [1, 2, 3, 4, 5, 6, 7],
         "shift_margin_min": 30,
         "min_send_interval_s": 60,
         "still":   { "gps_interval_s": 300, "gps_min_interval_s": 120, "send_distance_m": 300, "send_max_interval_s": 300 },
         "foot":    { "gps_interval_s": 30,  "gps_min_interval_s": 15,  "send_distance_m": 100, "send_max_interval_s": 180 },
         "vehicle": { "gps_interval_s": 15,  "gps_min_interval_s": 10,  "send_distance_m": 300, "send_max_interval_s": 120,
                      "batch_s": 60, "high_accuracy": false }
       }'::jsonb
       || COALESCE(tracker_config, '{}'::jsonb)
       -- Política atual: aplicada por último para valer mesmo se a versão anterior já rodou.
       || '{ "shift_only": true, "window_start": "07:00", "window_end": "19:00",
             "shift_margin_min": 0, "shift_days": [1, 2, 3, 4, 5, 6, 7] }'::jsonb;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Conferência:
--   SELECT jsonb_pretty(tracker_config) FROM public.cfg_app;
-- Mudar a janela (ex.: 06:00–20:00):
--   UPDATE public.cfg_app SET tracker_config = tracker_config || '{"window_start":"06:00","window_end":"20:00"}';
-- Voltar a usar o turno de cada usuário (users.shift_start/shift_end):
--   UPDATE public.cfg_app SET tracker_config = tracker_config - 'window_start' - 'window_end';
-- Expediente só de segunda a sexta:
--   UPDATE public.cfg_app SET tracker_config = jsonb_set(tracker_config, '{shift_days}', '[1,2,3,4,5]');
-- Desligar a pausa fora do expediente:
--   UPDATE public.cfg_app SET tracker_config = jsonb_set(tracker_config, '{shift_only}', 'false');
-- Ajustar um valor (ex.: heartbeat parado para 10 min):
--   UPDATE public.cfg_app SET tracker_config = jsonb_set(tracker_config, '{still,send_max_interval_s}', '600');
