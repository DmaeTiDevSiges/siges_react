# Otimização de Imagens — Cloudflare R2 + Variantes pré-geradas

> **Status (20/09/2026):** Arquitetura migrada do **imgproxy** para **variantes geradas no upload** (Caminho B).
> Ver também: [`IMAGES_PERFORMANCE_PLAN.md`](./IMAGES_PERFORMANCE_PLAN.md).

## Visão Geral

O sistema Siges utiliza **Cloudflare R2** para armazenamento e **3 variantes geradas no upload** (thumb ≤400, medium ≤800, original ≤2048, todas WebP). A exibição usa `OptimizedImage` com `srcset` direto do R2/CDN — **sem imgproxy e sem VPS no caminho de leitura**.

## Arquitetura

```
[Captura] → compressAndGenerateVariants (1 decode, 3 encodes WebP)
                 ↓
         [Cloudflare R2]  original.webp + original.medium.webp + original.thumb.webp
                 ↓
[Exibição] OptimizedImage srcset(thumb|medium|original) ← Cloudflare CDN (custom domain)
```

### Fluxo de Upload

1. Usuário seleciona/fotografa imagem
2. `compressAndGenerateVariants` gera original + medium + thumb (Canvas/WebP)
3. `r2Service.uploadImageWithVariants` sobe os 3 arquivos **em paralelo** com progresso agregado
4. Só o **filename do original** é salvo no banco (sem migration de schema)

### Convenção de nomes (variantes derivadas, sem coluna extra)

```
companies/{c}/assets/{a}/before_1727_x9k2.webp           ← original (no banco)
companies/{c}/assets/{a}/before_1727_x9k2.medium.webp     ← ≤800px
companies/{c}/assets/{a}/before_1727_x9k2.thumb.webp      ← ≤400px
```

Helpers: `addVariantToPath` / `getVariantUrl` / `buildVariantSrcSet` em `services/imageUtils.ts`.

### Fluxo de Exibição

1. Componente monta URL do original (path + filename no banco)
2. `OptimizedImage` aplica preset → variante (`thumbnail`→thumb, `medium`→medium, `large/original`→original)
3. `srcset` = thumb 400w + medium 800w + original 1600w
4. Se a variante 404 (**imagens antigas** sem sufixo), fallback automático para o original

## Componentes

### Backend / serviços

| Arquivo | Papel |
|---------|--------|
| `services/imageCompressionService.ts` | `compressAndGenerateVariants` (1 decode → 3 blobs) |
| `services/r2Service.ts` | singleton `S3Client`, `uploadFiles` paralelo, `uploadImageWithVariants` |
| `services/imageUtils.ts` | `getPublicImageUrl`, `getVariantUrl`, `buildVariantSrcSet` |
| `services/imgproxyService.ts` | **legado** — ainda usado em geração de PDF; fora do caminho feliz de exibição |

### Frontend

| Arquivo | Papel |
|---------|--------|
| `components/ui/OptimizedImage.tsx` | preset → variante + srcset + fallback original |
| `components/ui/PhotoViewer.tsx` / `Avatar.tsx` | usam `OptimizedImage` |

**Props de `OptimizedImage`:** `src`, `alt`, `preset` (`thumbnail|medium|large|original`), `className`, `onClick`, `useSrcSet`, `loading`.

## Configuração

### Variáveis de Ambiente

```env
# Cloudflare R2
VITE_R2_ACCESS_KEY_ID=...
VITE_R2_SECRET_ACCESS_KEY=...
VITE_R2_BUCKET_NAME=siges
VITE_R2_ACCOUNT_ID=...
# Ideal: custom domain do R2 atrás do Cloudflare (proxy laranja)
VITE_R2_PUBLIC_URL=https://img-storage.siges-app.com.br
```

### Custom domain R2 + Cloudflare (recomendado)

1. Cloudflare Dashboard → R2 → bucket `siges` → **Settings → Public Development URL** ou conectar domínio próprio
2. DNS: apontar `img-storage.siges-app.com.br` para o R2 com **proxy Cloudflare ON** (laranja)
3. Cache Rule: *Cache Everything* / Edge TTL ≥ 1 mês para o host de imagens
4. Atualizar `VITE_R2_PUBLIC_URL` no `.env.local`
5. Validar: `curl -sI <url-imagem>` deve retornar `cf-ray` e, no 2º acesso, `CF-Cache-Status: HIT`

> O endpoint `https://pub-*.r2.dev` é de desenvolvimento — preferir custom domain em produção.

### imgproxy (legado)

- `VITE_IMGPROXY_URL/KEY/SALT` só são necessários se ainda se usa **export PDF** com transform on-demand
- A exibição em tela **não** usa mais imgproxy
- Migração de PDFs para variantes R2 = follow-up (fora do escopo do plano B)

## Performance

### O que mudou vs arquitetura anterior (imgproxy)

| Antes | Depois |
|-------|--------|
| 1º load de cada variante = VPS (~0,8–3,7s TTFB, sem CDN) | R2 + CF CDN edge |
| srcSet = 4 URLs assinadas imgproxy | srcSet = 3 arquivos estáveis no R2 |
| Circuit breaker → originais pesados | fallback natural para original (mesmo arquivo) |
| HMAC key no bundle do client | sem segredo de transform no front |
| Upload 1 arquivo | Upload 3 arquivos em paralelo (progresso agregado) |

### Benchmark esperado (2ª exibição)

- TTFB **< 200ms** com HIT de CDN/browser
- Sem request a `195.7.7.16` / imgproxy

## Fora de escopo / follow-ups

1. **Remigração** de imagens antigas para `.thumb`/`.medium` (script de batch no bucket)
2. **Remoção completa** do `imgproxyService` + envs + `crypto-js` se órfão (após migrar PDFs)
3. Upload via backend/presigned URL (segredos R2 fora do bundle)
4. AVIF, cache warming, Core Web Vitals

## Troubleshooting

### Imagem não carrega (variante 404)

- **Esperado em imagens antigas** — `OptimizedImage` deve cair para o original no `onError`
- Se **tudo** 404: conferir `VITE_R2_PUBLIC_URL` e permissão do bucket

### Ainda lento na 2ª visita

- Verificar `CF-Cache-Status` no DevTools (precisa de proxy laranja + cache rule)
- Confirmar que a URL não tem `?v=` (cacheBust foi removido do código)

### Upload falha

- Console do app: erros do `r2Service` mostram bucket/key
- Credenciais R2 no `.env.local` (`VITE_R2_*`)

