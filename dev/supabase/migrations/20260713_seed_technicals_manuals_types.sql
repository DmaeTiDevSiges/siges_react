-- Seed: Tipos de documentos técnicos
INSERT INTO public.technicals_manuals_types (description, is_deleted)
VALUES
    ('Manual', false),
    ('Desenho Técnico', false),
    ('Laudo', false),
    ('Especificação', false),
    ('Procedimento', false),
    ('Folha de Dados', false),
    ('Catálogo', false),
    ('Foto', false)
ON CONFLICT DO NOTHING;
