-- =============================================================================
-- Backfill: Set chat_created_user_id for all visits with existing chat messages
-- Date: 2026-07-22
-- =============================================================================

-- For each visit that has chat messages but no chat_created_user_id,
-- set it to the user who sent the first message

UPDATE orders_visits ov
SET chat_created_user_id = (
    SELECT user_id
    FROM orders_visits_chat oc
    WHERE oc.ov_id = ov.id
    ORDER BY oc.created_at ASC
    LIMIT 1
)
WHERE ov.chat_created_user_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM orders_visits_chat oc
    WHERE oc.ov_id = ov.id
  );

-- Verify: how many were updated?
SELECT
    COUNT(*) FILTER (WHERE chat_created_user_id IS NOT NULL) AS filled,
    COUNT(*) FILTER (WHERE chat_created_user_id IS NULL) AS still_null,
    COUNT(*) AS total
FROM orders_visits
WHERE chat_status = 'open' AND is_deleted = false;
