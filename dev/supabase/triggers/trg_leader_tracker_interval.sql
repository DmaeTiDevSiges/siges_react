-- =============================================================================
-- TRIGGER: trg_leader_tracker_interval
-- Descrição: Ajusta automaticamente tracker_interval_seconds para líderes:
--            - Ocupado (is_ov_in_progress = true)  → 30 segundos
--            - Não ocupado                         → 180 segundos
--            Não aplica para não-líderes (mantém valor manual/default).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fc_leader_tracker_interval()
RETURNS TRIGGER AS $$
BEGIN
    -- Só aplica para líderes de equipe
    IF NEW.is_team_leader = true THEN
        IF NEW.is_ov_in_progress = true THEN
            NEW.tracker_interval_seconds := 30;
        ELSE
            NEW.tracker_interval_seconds := 180;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Trigger antes de UPDATE nos campos relevantes
DROP TRIGGER IF EXISTS trg_leader_tracker_interval ON public.users;

CREATE TRIGGER trg_leader_tracker_interval
    BEFORE UPDATE OF is_ov_in_progress, is_team_leader
    ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.fc_leader_tracker_interval();

-- Atualiza líderes existentes com o valor correto
UPDATE public.users
SET tracker_interval_seconds = CASE
    WHEN is_ov_in_progress = true THEN 30
    ELSE 180
END
WHERE is_team_leader = true;

NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION public.fc_leader_tracker_interval() IS
'v1.0.0 - Ajusta tracker_interval_seconds automaticamente para líderes: 30s quando ocupado, 180s quando livre.';
