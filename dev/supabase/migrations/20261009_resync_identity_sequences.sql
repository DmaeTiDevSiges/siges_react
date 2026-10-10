-- =====================================================
-- Migration: Realinhar sequences (identity/serial) atrasadas
-- Date: 2026-10-09
-- Description: INSERT em cfg_companies falha com 409 /
--              23505 "duplicate key value violates unique
--              constraint companies_pkey".
--
--              O app insere SEM id (services/companies/
--              companiesService.ts:createCompany → dbData sem
--              id), então o valor vem da identity
--              public.cfg_companies_id_seq. A tabela tem
--              MAX(id) = 21 (linhas seedadas com id explícito
--              em dev/supabase/data/cfg_companies_rows.sql),
--              mas a sequence está atrás disso → nextval()
--              devolve um id já existente.
--
--              Causa raiz: seeds/restores com id explícito não
--              avançam a sequence. Como várias tabelas têm seed
--              em dev/supabase/data/*_rows.sql, o mesmo problema
--              pode aparecer em outras tabelas.
--
--              Conferência manual (somente leitura):
--                SELECT last_value, is_called
--                  FROM public.cfg_companies_id_seq;
--                SELECT MAX(id) FROM public.cfg_companies;
-- =====================================================

-- -----------------------------------------------------
-- 1) Fix direto e explícito do cfg_companies (padrão já
--    usado em 20260927_add_materials_upload_route.sql)
-- -----------------------------------------------------
SELECT setval(
    pg_get_serial_sequence('cfg_companies', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_companies),
        (SELECT last_value FROM cfg_companies_id_seq)
    )
);

-- -----------------------------------------------------
-- 2) Varredura de TODAS as colunas id identity/serial do
--    schema public: avança a sequence até MAX(id).
--    Nunca retrocede. Idempotente. Não altera dados.
-- -----------------------------------------------------
DO $$
DECLARE
    t          record;
    seq_name   text;
    max_id     bigint;
    last_val   bigint;
    was_called boolean;
    n_checked  integer := 0;
    n_fixed    integer := 0;
BEGIN
    FOR t IN
        SELECT c.relname AS tbl,
               a.attname AS col
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid
        LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r', 'p')
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND (
                a.attidentity <> ''
             OR (a.atthasdef
                 AND d.oid IS NOT NULL
                 AND pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval(%')
          )
        ORDER BY c.relname, a.attnum
    LOOP
        seq_name := pg_get_serial_sequence(
                        format('%I.%I', 'public', t.tbl), t.col);
        CONTINUE WHEN seq_name IS NULL;

        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM public.%I',
                       t.col, t.tbl)
            INTO max_id;
        EXECUTE format('SELECT last_value, is_called FROM %s', seq_name)
            INTO last_val, was_called;

        n_checked := n_checked + 1;

        IF max_id > 0 AND (NOT was_called OR last_val < max_id) THEN
            PERFORM setval(seq_name, max_id, true);
            n_fixed := n_fixed + 1;
            RAISE NOTICE 'sequence % realinhada: % → % (is_called % → true)',
                         seq_name, last_val, max_id, was_called;
        END IF;
    END LOOP;

    RAISE NOTICE '% sequences verificadas, % realinhadas', n_checked, n_fixed;
END $$;
