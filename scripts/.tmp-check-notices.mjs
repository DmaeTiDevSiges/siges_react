// Diagnóstico SOMENTE LEITURA: estado dos avisos (vigência x janela de visualização).
import { Client } from 'pg';

const client = new Client({
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME,
});

const sql = `
SET timezone = 'America/Sao_Paulo';
SELECT
  now()                                            AS agora_sp,
  id,
  left(title, 28)                                  AS titulo,
  is_active,
  start_date                                       AS vig_inicio,
  end_date                                         AS vig_fim,
  view_start_date                                  AS vis_inicio,
  view_end_date                                    AS vis_fim,
  (is_active AND view_start_date <= now() AND view_end_date >= now()) AS na_lista,
  (now() >= start_date AND now() <= end_date)     AS vig_ativa,
  (now() < start_date)                             AS vig_futura,
  (now() > end_date)                               AS vig_encerrada
FROM public.cfg_app_notices
ORDER BY id DESC
LIMIT 12;

SELECT p.id, p.notice_id, p.label, p.period_start, p.period_end, p.position_index,
       (SELECT count(*) FROM public.cfg_app_notices_workers w WHERE w.workers_period_id = p.id) AS lancamentos
FROM public.cfg_app_notices_workers_periods p
ORDER BY p.notice_id, p.position_index
LIMIT 20;
`;

try {
  await client.connect();
  const res = await client.query(sql);
  console.table(res.rows[0]);
  console.table(res.rows[1]);
} catch (e) {
  console.error('FALHA NA CONSULTA:', e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
