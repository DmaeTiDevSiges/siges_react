# Otimização de Imagens - Cloudflare R2 + imgproxy

## Visão Geral

O sistema Siges utiliza Cloudflare R2 para armazenamento de imagens e imgproxy (hospedado em VPS) para otimização on-demand, proporcionando carregamento rápido e eficiente de imagens.

## Arquitetura

```
[Aplicação] → [Upload] → [Cloudflare R2]
                              ↓
[Usuário] ← [CDN Cloudflare] ← [imgproxy VPS]
```

### Fluxo de Upload

1. Usuário seleciona imagem na aplicação
2. Imagem é enviada para Cloudflare R2 via `r2Service`
3. URL pública do R2 é armazenada no banco de dados

### Fluxo de Exibição

1. Aplicação obtém URL do R2 do banco de dados
2. Componente `OptimizedImage` gera URL otimizada via imgproxy
3. imgproxy busca imagem do R2, aplica transformações e serve ao usuário
4. CDN Cloudflare cacheia a imagem otimizada

## Componentes

### Backend

#### `r2Service.ts`

Serviço para upload e gerenciamento de arquivos no Cloudflare R2.

**Funções principais:**
- `uploadFile(file, path)` - Faz upload de arquivo para R2
- `deleteFile(path)` - Remove arquivo do R2
- `getPublicUrl(path)` - Gera URL pública do R2
- `isR2Configured()` - Verifica se R2 está configurado

**Exemplo de uso:**
```typescript
import { r2Service } from './services/r2Service';

const result = await r2Service.uploadFile(file, 'companies/123/assets/456/image.jpg');
console.log(result.publicUrl); // https://pub-xxxxx.r2.dev/companies/123/assets/456/image.jpg
```

---

#### `imgproxyService.ts`

Serviço para geração de URLs otimizadas via imgproxy com assinatura HMAC.

**Funções principais:**
- `generateUrl(sourceUrl, options)` - Gera URL otimizada customizada
- `getPresetUrl(sourceUrl, preset)` - Gera URL com preset pré-configurado
- `generateSrcSet(sourceUrl)` - Gera srcset para imagens responsivas
- `isImgproxyConfigured()` - Verifica se imgproxy está configurado

**Presets disponíveis:**
- `thumbnail`: 150x150, quality 80, webp
- `medium`: 800x800, quality 85, webp
- `large`: 1920x1920, quality 90, webp
- `original`: sem transformação

**Exemplo de uso:**
```typescript
import { imgproxyService } from './services/imgproxyService';

const sourceUrl = 'https://pub-xxxxx.r2.dev/companies/123/assets/456/image.jpg';

// Usando preset
const optimizedUrl = imgproxyService.getPresetUrl(sourceUrl, 'medium');

// Customizado
const customUrl = imgproxyService.generateUrl(sourceUrl, {
  width: 400,
  height: 300,
  resize: 'fill',
  quality: 90,
  format: 'webp'
});
```

---

### Frontend

#### `OptimizedImage.tsx`

Componente React para exibição de imagens otimizadas com lazy loading e srcset.

**Props:**
- `src` (string, obrigatório) - URL da imagem original (R2)
- `alt` (string, obrigatório) - Texto alternativo
- `preset` (ImagePreset, opcional) - Preset de otimização (default: 'medium')
- `className` (string, opcional) - Classes CSS
- `onClick` (function, opcional) - Handler de clique
- `useSrcSet` (boolean, opcional) - Habilitar srcset responsivo (default: true)
- `loading` ('lazy' | 'eager', opcional) - Estratégia de carregamento (default: 'lazy')

**Exemplo de uso:**
```tsx
import { OptimizedImage } from './components/ui/OptimizedImage';

// Básico
<OptimizedImage 
  src="https://pub-xxxxx.r2.dev/companies/123/assets/456/image.jpg"
  alt="Foto do ativo"
/>

// Com preset
<OptimizedImage 
  src={imageUrl}
  alt="Thumbnail"
  preset="thumbnail"
  className="w-20 h-20 rounded-full"
/>

// Sem srcset (imagem fixa)
<OptimizedImage 
  src={imageUrl}
  alt="Banner"
  preset="large"
  useSrcSet={false}
/>
```

**Recursos:**
- ✅ Lazy loading nativo
- ✅ Responsive images com srcset
- ✅ Fallback automático para imagem original em caso de erro
- ✅ Placeholder animado durante carregamento
- ✅ Suporte a diferentes presets

---

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Cloudflare R2
VITE_R2_ACCESS_KEY_ID=your_access_key_id
VITE_R2_SECRET_ACCESS_KEY=your_secret_access_key
VITE_R2_BUCKET_NAME=your_bucket_name
VITE_R2_ACCOUNT_ID=your_account_id
VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# imgproxy
VITE_IMGPROXY_URL=https://195.7.7.16
VITE_IMGPROXY_KEY=your_imgproxy_key_in_hex
VITE_IMGPROXY_SALT=your_imgproxy_salt_in_hex
```

### Obtendo Credenciais

#### Cloudflare R2

1. Acesse o dashboard do Cloudflare
2. Navegue para R2 > Buckets
3. Crie um bucket ou selecione um existente
4. Vá em "Settings" > "R2 API Tokens"
5. Crie um token com permissões de leitura/escrita
6. Copie o Access Key ID e Secret Access Key
7. O Account ID está disponível na URL do dashboard
8. O Public URL está em "Settings" > "Public Access"

#### imgproxy

As chaves do imgproxy devem estar em formato hexadecimal. Se você possui as chaves em base64, converta para hex:

```bash
echo -n "sua_key_base64" | base64 -d | xxd -p -c 256
echo -n "seu_salt_base64" | base64 -d | xxd -p -c 256
```

---

## Migração de Código Existente

### Substituir ImageWithFallback por OptimizedImage

**Antes:**
```tsx
<ImageWithFallback
  src={imageUrl}
  alt="Foto"
  className="w-full h-full object-cover"
/>
```

**Depois:**
```tsx
<OptimizedImage
  src={imageUrl}
  alt="Foto"
  preset="medium"
  className="w-full h-full object-cover"
/>
```

### Upload de Imagens

O método `dataService.uploadOrderVisitAssetPhoto()` já foi migrado para usar R2 automaticamente. Não é necessário alterar código de upload existente.

---

## Performance

### Benefícios

- **Redução de tamanho**: Imagens convertidas para WebP (até 30% menor que JPEG)
- **Responsive images**: Browser carrega apenas a resolução necessária
- **Lazy loading**: Imagens fora da viewport não são carregadas
- **Cache CDN**: Cloudflare cacheia imagens otimizadas globalmente
- **On-demand**: Transformações aplicadas apenas quando necessário

### Benchmarks Esperados

| Métrica | Antes (Supabase) | Depois (R2 + imgproxy) |
|---------|------------------|------------------------|
| Tamanho médio | ~500KB | ~150KB (-70%) |
| LCP | ~3.5s | ~1.2s (-66%) |
| Lighthouse Performance | 65-75 | 90-95 |

---

## Troubleshooting

### Imagens não carregam

1. **Verifique variáveis de ambiente:**
   ```bash
   echo $VITE_R2_PUBLIC_URL
   echo $VITE_IMGPROXY_URL
   ```

2. **Verifique console do browser** para erros de CORS ou 403

3. **Teste URL direta do R2** no navegador

4. **Verifique se imgproxy está acessível:**
   ```bash
   curl https://195.7.7.16/health
   ```

### Imagens aparecem mas sem otimização

1. **Verifique se imgproxy está configurado:**
   - Abra DevTools > Network
   - Verifique se URLs contêm `195.7.7.16`
   - Se não, verifique `VITE_IMGPROXY_KEY` e `VITE_IMGPROXY_SALT`

2. **Verifique assinatura:**
   - Erro 403 do imgproxy indica assinatura inválida
   - Confirme que key e salt estão em formato hexadecimal

### Performance não melhorou

1. **Verifique cache CDN:**
   - Abra DevTools > Network
   - Procure por header `CF-Cache-Status: HIT`
   - Se `MISS`, aguarde algumas requisições

2. **Verifique formato da imagem:**
   - Deve ser WebP (Content-Type: image/webp)
   - Se não, verifique configuração do imgproxy

---

## Segurança

### Assinatura de URLs

Todas as URLs do imgproxy são assinadas com HMAC-SHA256 para prevenir:
- Uso não autorizado do serviço
- Ataques de amplificação
- Manipulação de parâmetros

### Boas Práticas

- ✅ Nunca exponha `VITE_IMGPROXY_KEY` e `VITE_IMGPROXY_SALT` no código
- ✅ Use variáveis de ambiente
- ✅ Rotacione chaves periodicamente
- ✅ Configure CORS no R2 para permitir apenas seu domínio

---

## Próximos Passos

- [ ] Implementar migração de imagens antigas do Supabase para R2
- [ ] Adicionar suporte a AVIF (formato mais eficiente que WebP)
- [ ] Implementar pré-aquecimento de cache para imagens críticas
- [ ] Adicionar monitoramento de performance (Core Web Vitals)
