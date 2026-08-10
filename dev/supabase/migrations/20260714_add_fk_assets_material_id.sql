-- Migration: Adicionar FK de assets.material_id para materials.id

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_material_id_fkey
    FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE SET NULL;
