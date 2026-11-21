# Plano: apagar do R2 as fotos removidas do relatório do ativo

Status: **proposta** (2026-11-20). Nada implementado.
Plano de implementação: `docs/superpowers/plans/2026-11-20-limpeza-fotos-r2.md`.

## 1. Como está hoje

Fotos do relatório do ativo sobem na hora (editor → `savePhoto` → 3 versões no R2: original, `.medium`, `.thumb`)
para `companies/{o_provider_company_id}/assets/{asset_id}/` e o nome entra em
`orders_visits_assets.before_img_files_names` / `after_img_files_names` (pasta em `before_img_file_path` / `after_img_file_path`).

| Situação | Banco | R2 |
|---|---|---|
| Remover foto (`removeOrderVisitAssetPhoto`, visitsService.ts:2258) | sai da lista | **fica** (3 arquivos) |
| Substituir/editar foto (`savePhoto` com índice, useReportPhotos.ts:104) | nova entra, antiga sai | antiga **fica** |
| Remover ativo da visita (`removeAssetFromOrderVisit`, visitsService.ts:2440) | linha apagada (hard delete) | tenta apagar em `companies/{o_company_id}/{asset_id}/` — **caminho errado** (falta `/assets/`, empresa pode ser outra); falha silenciosa; e apaga **antes** de apagar o banco |
| Excluir visita (`collectVisitFilePaths`, visitsService.ts:~5140) | soft delete | apaga pelos `*_img_file_path` gravados (caminho certo), sem checar uso |
| Remover foto do checklist (maintenancePlansService) | sai da lista | apaga, sem checar uso |

### Quem mais aponta para o mesmo arquivo

A pasta `companies/{c}/assets/{a}/` é compartilhada por:
- fotos do relatório (`before_*` / `after_*`), de **todas as visitas** daquele ativo;
- fotos do checklist (`checklistFolderPath`, `orders_visits_assets_activities.img_files_names`);
- **foto de capa do ativo**: "usar como foto de capa" (`updateAssetPhotoFromReport`) **não copia** o arquivo —
  `assets.img_file_path/img_file_name` passa a apontar para a foto do relatório. Apagar essa foto quebraria a capa.

"Copiar de Outro Ativo" não copia fotos (sem risco).

Conclusão: só pode apagar do R2 o arquivo que **nenhum** registro referencia. O app não enxerga todas as
linhas (RLS / escopo por cliente), então a checagem tem que ser no banco.

## 2. Proposta

1. **Função no banco** `fc_r2_unreferenced_photos(p_folder text, p_names text[]) RETURNS text[]` (SECURITY DEFINER):
   devolve os nomes de `p_names` que não aparecem em nenhuma referência (OVA before/after e colunas antigas de
   foto única — inclusive linhas com `is_deleted`, checklist, capa do ativo, revisões abertas). Compara **só pelo
   nome, em qualquer pasta** (o APK atual pode montar a pasta com outra empresa). Lista conferida no banco vivo.
2. **Serviço único** `services/media/photoCleanupService.ts`: `deleteUnreferencedPhotos(folder, names)` →
   pergunta à função, apaga as 3 versões de cada nome livre (`Promise.allSettled`), devolve contagem.
   Melhor esforço: falha no R2 não desfaz a remoção no banco (a rotina do item 5 recolhe o que sobrar).
3. **Remover / substituir foto do relatório**: depois do `UPDATE` do banco, chama `deleteUnreferencedPhotos`.
   Offline: nada muda na fila — a operação reexecuta o método do serviço ao sincronizar, e a limpeza vem junto.
4. **Remover ativo da visita**: usa os `before_img_file_path` / `after_img_file_path` gravados (com o padrão
   atual como reserva), apaga **depois** das linhas do banco e passa pela checagem (protege a capa).
   Exclusão de visita e remoção de foto do checklist passam pela mesma checagem.
5. **Arquivos que já ficaram para trás**: script `scripts/r2-orphan-photos.ts` (rodado manualmente com `npx tsx`, credenciais
   de serviço do `.env`), lista `companies/*/assets/*/`, agrupa original+variantes, pergunta à função e:
   - padrão **simulação** (`--dry-run`): gera CSV com o que apagaria e o total em MB;
   - `--apply`: apaga; só arquivos com mais de **7 dias** (protege envio em andamento e fila offline ainda não sincronizada).

## 3. Fora do escopo

- Outras pastas do R2 (OS, unidades, usuários, manuais).
- Copiar a foto ao usar como capa (deixaria a capa independente) — pode virar melhoria depois.
- Rotina automática (cron) — primeiro rodar o script à mão e ver o volume.
