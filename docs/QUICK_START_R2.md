# 🔧 Guia Rápido - Resolver Erros CORS

## Problema

Você está vendo erros CORS porque:
1. ❌ O servidor `npm run dev` foi iniciado **antes** das variáveis R2/imgproxy serem configuradas
2. ❌ O Vite só carrega variáveis de ambiente na inicialização
3. ❌ As imagens antigas ainda estão no Supabase, não no R2

## Solução Rápida

### 1. Reiniciar o Servidor de Desenvolvimento

**No terminal onde `npm run dev` está rodando:**

```bash
# Pressione Ctrl+C para parar o servidor
# Depois execute novamente:
npm run dev
```

### 2. Verificar se as Variáveis Foram Carregadas

Após reiniciar, abra o console do navegador (F12) e execute:

```javascript
console.log('R2 URL:', import.meta.env.VITE_R2_PUBLIC_URL);
console.log('imgproxy URL:', import.meta.env.VITE_IMGPROXY_URL);
```

**Resultado esperado:**
```
R2 URL: https://pub-1efd12df72637dc4a14ee1cfc296f681.r2.dev
imgproxy URL: https://195.7.7.16
```

Se aparecer `undefined`, as variáveis não foram carregadas.

---

## Testando o Upload

### 1. Upload de Imagem de Asset

1. Vá em **Assets** (Ativos)
2. Clique em **"+ Novo Ativo"** ou edite um existente
3. Faça upload de uma imagem
4. Abra o **DevTools > Network**
5. Verifique se a requisição vai para:
   - ✅ `https://pub-1efd12df72637dc4a14ee1cfc296f681.r2.dev` (R2)
   - ✅ `https://195.7.7.16` (imgproxy)

### 2. Upload de Foto de Visita

1. Vá em **Ordens de Serviço**
2. Abra uma OS e vá em **Visitas**
3. Abra um ativo e adicione foto em "Condição Antes" ou "Condição Depois"
4. Verifique no **DevTools > Network** se vai para R2

---

## Imagens Antigas (Supabase)

As imagens que já existem no sistema **continuarão no Supabase Storage**.

**Comportamento esperado:**
- ✅ **Novas imagens** → vão para R2 + otimização imgproxy
- ✅ **Imagens antigas** → continuam no Supabase (fallback automático)

**Se quiser migrar imagens antigas:**
- Será necessário criar um script de migração (não incluído nesta implementação)

---

## Troubleshooting

### Erro: "Failed to load resource: net::ERR_FAILED"

**Causa:** imgproxy tentando acessar imagem que não existe no R2

**Solução:** 
- Ignore erros de imagens antigas (elas estão no Supabase)
- Teste com **nova imagem** (upload após reiniciar o servidor)

### Erro: "CORS policy: Response to preflight request doesn't pass"

**Causa:** Servidor não reiniciado ou CORS não configurado no R2

**Solução:**
1. Reinicie `npm run dev`
2. Se persistir, configure CORS no bucket R2:
   - Dashboard Cloudflare > R2 > seu bucket > Settings > CORS policy

**CORS policy recomendada:**
```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "https://seu-dominio.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Erro: imgproxy retorna 403 (Forbidden)

**Causa:** Assinatura HMAC inválida

**Solução:**
- Verifique se `VITE_IMGPROXY_KEY` e `VITE_IMGPROXY_SALT` estão em **formato hexadecimal**
- Se estiverem em base64, converta:

```bash
# Linux/Mac
echo -n "sua_key_base64" | base64 -d | xxd -p -c 256

# Windows PowerShell
[System.BitConverter]::ToString([System.Convert]::FromBase64String("sua_key_base64")).Replace("-","").ToLower()
```

---

## Checklist de Verificação

Antes de testar, confirme:

- [ ] Arquivo `.env.local` existe e contém todas as variáveis
- [ ] Servidor `npm run dev` foi **reiniciado** após configurar `.env.local`
- [ ] Console do navegador mostra as variáveis carregadas
- [ ] Você está testando com **nova imagem** (não imagem antiga do Supabase)

---

## Próximos Passos

Após resolver os erros CORS:

1. ✅ Teste upload de imagem de asset
2. ✅ Teste upload de foto de visita
3. ✅ Verifique otimização no DevTools (tamanho, formato WebP)
4. ✅ Teste em diferentes dispositivos/resoluções
5. ✅ Execute Lighthouse audit para verificar performance

---

**Dúvidas?** Consulte a documentação completa em `docs/IMAGES_OPTIMIZATION.md`
