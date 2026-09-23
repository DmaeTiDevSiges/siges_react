# 📄 Otimização de Imagens — Plano de Performance (Caminho B)

**Data:** 23/09/2026
**Status:** ✅ Executado (código) — pendente: validação em device + custom domain R2/CF
**Contexto:** Upload lento + imagens demoram a aparecer **sempre** (mesmo recarregando), app mobile Capacitor.

## 1. Diagnóstico

### 1.1 Exibição "sempre lenta" (evidências medidas)

| Evidência | Resultado |
|-----------|-----------|
| `img.siges-app.com.br` → `195.7.7.16`, sem `cf-ray` | imgproxy **não está atrás do CDN Cloudflare** |
| TLS/TTFB do imgproxy (3 testes) | TLS 0,47–1,03s · TTFB **0,77–3,7s**/request |
| Mesmo caminho via Cloudflare (r2.dev) | TLS 0,02s · total 0,24s |
| Headers do imgproxy | sem `Cache-Control` público em imagem |
| `unitsService.ts:95`, `App.tsx:1683,1717` | `cacheBust: Date.now()` → cache do browser anulado |
| `srcSet` no `OptimizedImage` | 4 URLs assinadas distintas por imagem = 4 cache keys frias |
| Circuit breaker (`imgproxyService.ts:203`) | 3 falhas → 2min sem imgproxy → originais pesados do `r2.dev` |
| ~38 `<img>` cru | sem lazy, sem srcset, sem otimização |

**Conclusão:** cada exibição = viagem completa até a VPS (sem CDN, sem cache estável). O doc `IMAGES_OPTIMIZATION.md` promete `CF-Cache-Status: HIT`, mas na prática o subdomínio está com proxy desligado.

### 1.2 Upload lento

| Problema | Local |
|----------|-------|
| Cliente S3 recriado a cada upload (novo TLS) | `r2Service.ts:10,70` |
| 3 selects sequenciais antes do upload | `visitsService.ts:1512-1541` |
| Uploads multi-imagem sequenciais (`for`+`await`) | `AssetLoanChecklistForm.tsx:162-172`, `AssetLoanChecklistImageViewer.tsx` |
| Dupla compressão (JPEG → WebP) | `ImageEditorModal.tsx:441-444` |
| Assinatura errada: limite 1200px nunca aplicado | `dataService.ts:2958`, `AssetLoanChecklistImageViewer.tsx:101,144,157` |
| Checklist de manutenção envia imagem **sem compressão** | `maintenancePlansService.ts:577` |
| `arrayBuffer()` completo para imagens | `r2Service.ts:40-47,72` |
| Só 1 fluxo tem preview otimista (`blob:`) | `OrderVisitAssetReport.tsx` |

## 2. Decisão de arquitetura

**Caminho escolhido: B — eliminar imgproxy, gerar variantes no upload.**

| Opção | Descrição | Decisão |
|-------|-----------|---------|
| A | Manter imgproxy + CDN | descartado como alvo (VPS continua no caminho) |
| **B** | Variantes pré-geradas no R2 + CDN | **✅ escolhido** |
| C | Cloudflare Images/Polish | não avaliado por custo/escopo |

### 2.1 Variantes: 3 arquivos

| Variante | Dimensão | Uso |
|----------|----------|-----|
| `.thumb.webp` | ≤400px | listas, avatares, cards |
| `.medium.webp` | ≤800px | cards grandes, mobile |
| original (sem sufixo) | ≤2048px (hoje) | PhotoViewer, zoom |

### 2.2 Convenção de nomes (sem migration de banco)

O banco **continua** guardando só `path` + `filename` do original. Variantes são derivadas por sufixo no mesmo folder:

```
companies/{c}/assets/{a}/before_1727..._x9k2.webp           ← original (no banco)
companies/{c}/assets/{a}/before_1727..._x9k2.thumb.webp      ← derivada
companies/{c}/assets/{a}/before_1727..._x9k2.medium.webp     ← derivada
```

Imagens antigas (sem sufixo) continuam funcionando: só têm original — comportamento atual preservado.

### 2.3 Arquitetura alvo

```
[Upload]  compressForUpload → original + thumb + medium → R2 (Promise.all)
                                                      ↓
[Display] OptimizedImage → srcset direto do R2/CF CDN  → sem imgproxy, sem VPS
```

## 3. Fases de execução

### Fase 1 — Pipeline de upload com variantes

1. `imageCompressionService`: `compressAndGenerateVariants(file)` → `{ original, thumb, medium }` (1 decode, 3 encodes)
2. `r2Service`: upload de N arquivos em paralelo com progresso agregado
3. Migrar serviços de upload (prioridade: mobile — visitas, checklist empréstimo, ativos, unidades, avatares)
4. Original sem sufixo + variantes `.thumb.webp` / `.medium.webp`

### Fase 2 — Exibição sem imgproxy

5. Helper `getVariantUrl(url, preset)` em `imageUtils.ts`
6. `OptimizedImage`: srcset a partir das variantes R2
7. Remover `cacheBust: Date.now()` (`unitsService.ts:95`, `App.tsx:1683,1717`)
8. Migrar ~38 `<img>` cru → `OptimizedImage` (prioridade: listas/dashboards/header)
9. Custom domain R2 + Cloudflare proxy (passos documentados)

### Fase 3 — Upload mais rápido (independente do B)

10. Singleton `S3Client`
11. Loops sequenciais → `Promise.allSettled`
12. Corrigir assinatura `compressForUpload` (4 sites)
13. Compressão em `maintenancePlansService`
14. `maybeCompress` sem `arrayBuffer` para imagens
15. Selects pré-upload em paralelo
16. Editor: 1 encode só

### Fase 4 — Validação

17. Medição antes/depois (TTFB, tamanho, tempo de upload)
18. Teste real no app mobile
19. Lint + typecheck
20. Atualizar `IMAGES_OPTIMIZATION.md`

## 4. Fora de escopo (explicado)

> **Não entra nesta leva** — por decisão consciente de reduzir risco e tamanho da mudança. Podem virar follow-ups.

### 4.1 Remigração das imagens antigas para variantes

- **O que é:** todas as fotos já enviadas ao R2 hoje têm **só o original**. O plano não vai percorrer o bucket para gerar `.thumb`/`.medium` retroativamente.
- **Comportamento resultante:** imagem antiga = só original no srcset (browser baixa o ≤2048px onde usaria thumb). **Não quebra nada** — é o comportamento atual.
- **Por que fora:** requereria job de backend/varredura do bucket, efeito colateral em milhares de objetos, teste de integridade. Ganho marginal: só imagens antigas ficam "otimizadas ao meio".
- **Se quiser depois:** script `dev/scripts/` que lista o bucket e gera variantes em lote (mesma lógica de sufixo).

### 4.2 Remoção completa e imediata do código imgproxy

- **O que é:** apagar `imgproxyService.ts`, envs `VITE_IMGPROXY_*`, imports, circuit breaker, docs de HMAC.
- **Por que fora:** `OptimizedImage` tem fallback para URL original — dá para **deixar imgproxy morto no caminho feliz** sem apagar de uma vez; remove risco de quebrar um fluxo esquecido no meio da migração.
- **Efeito colateral aceito:** bundle ainda carrega código morto + `crypto-js` (se só imgproxy usava — verificar). Chaves `VITE_IMGPROXY_*` continuam no `.env` mas **deixam de ser usadas** no fluxo novo (exposição prática acaba).
- **Se quiser depois:** Fase de limpeza — remover arquivo, envs, docs e `crypto-js` se órfão.

### 4.3 Outros itens que não estão no escopo desta leva

| Item | O que é | Por que fora |
|------|---------|--------------|
| **CDN/cache do imgproxy (Caminho A)** | Ligar orange cloud em `img.siges-app.com.br` | redundante se B mata o imgproxy; só faria sentido como **ponte temporária** antes da Fase 1 ficar pronta |
| **Cloudflare Images/Polish (C)** | serviço pago de transform no CF | outro produto/custo; B resolve sem conta adicional |
| **Unificar `getPublicImageUrl` duplicado** | `imageUtils.ts` vs `dataService.getPublicImageUrl` | débito técnico real, mas refactor amplo com pouco ganho de performance imediato |
| **Signed URLs Supabase (logos clientes)** | `ordersService.ts:1317` usa storage legado | fluxo diferente (logos de provedor); não é o gargalo das fotos |
| **Segredos no bundle (`VITE_R2_*`)** | chaves R2 no front | arquitetura atual do upload client-side; mudar exige presigned URL no backend — outro projeto |
| **AVIF, cache warming, Core Web Vitals** | "próximos passos" do doc antigo | nice-to-have, fora do sintoma atual |
| **Progresso de UI em todos os fluxos** | barra de progresso onde hoje só tem spinner | polish de UX; paralelizar upload já melhora o tempo real |
| **UI otimista genérica** | preview `blob:` em todos os formulários | só `OrderVisitAssetReport` tem; estender é melhoria extra, não necessária para velocidade de rede |

## 5. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Variantes a mais encherem bucket | ~40–90KB extra/imagem; R2 sem egress |
| Fluxos que montam URL à mão não sabem do sufixo | helper único `getVariantUrl`; migração dos `<img>` cru cobre isso |
| Upload triplo mais lento na rede | 3 arquivos pequenos em paralelo < 1 original grande sequencial (medir na Fase 4) |
| Capacitor/WebView sem WebP | testar no device; fallback JPEG se necessário |
| Custom domain R2 atrasar | fazer 9 (docs + config) como tarefa separada, mensurável |

## 6. Critérios de aceite

- [ ] 2ª exibição da mesma imagem: TTFB **< 200ms**, sem request a `195.7.7.16` *(medição em device/produção — pendente)*
- [x] Checklist de empréstimo com 3 imagens: upload **paralelo**, sem loop serial
- [x] Nenhuma chamada a `compressForUpload` com argumentos posicionais errados
- [x] Toda imagem de checklist de manutenção passa por compressão
- [x] Lint + typecheck verdes *(para os arquivos do escopo; erros pré-existentes em outros módulos permanecem)*
- [x] `IMAGES_OPTIMIZATION.md` reflete a arquitetura nova

---

## Resumo do fora de escopo

1. **Imagens antigas não ganham variantes** — continua tudo funcionando, só não ficam "otimizadas ao meio"; dá para gerar em lote depois.
2. **Código do imgproxy não é apagado agora** — fica desligado do caminho feliz com segurança; limpeza = follow-up.
3. **Não vamos** (nesta leva): refatorar URL builders duplicados, mudar para upload via backend/presigned, contratar Cloudflare Images, migrar logos do Supabase legado, adicionar AVIF/cache warming, estender UI otimista/progresso para todos os formulários.
