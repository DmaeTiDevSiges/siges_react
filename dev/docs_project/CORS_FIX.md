# 🚨 Correção Crítica: Erro de CORS no Upload R2

O erro que você está vendo (`blocked by CORS policy`) acontece porque o navegador (rodando em `http://10.93.154.235:3000` ou similar) está tentando enviar dados (PUT) para um domínio diferente (`*.r2.cloudflarestorage.com`) e o R2 não deu permissão explícita para isso.

## Como Resolver (Passo a Passo)

Você precisa adicionar uma regra de CORS no seu bucket R2 no painel do Cloudflare.

1. **Acesse o Dashboard do Cloudflare**: [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Vá para **R2** no menu lateral.
3. Clique no nome do seu bucket (ex: `siges`).
4. Clique na aba **Settings** (Configurações).
5. Role para baixo até encontrar a seção **CORS Policy**.
6. Clique em **Add CORS policy** (ou Edit).
7. Cole o seguinte JSON (permite acesso de qualquer origem para desenvolvimento):

```json
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

> **Nota de Segurança:** Para produção, substitua `"*"` em `AllowedOrigins` pela URL do seu app (ex: `["https://seu-app.com"]`). Mas para desenvolvimento local e testes em rede, `"*"` é o mais prático para resolver agora.

8. Clique em **Save**.

## Testando Novamente

Após salvar, aguarde alguns segundos e tente fazer o upload novamente na aplicação. O erro de CORS deve desaparecer imediatamente.

---

### Por que isso é necessário?

O upload direto do navegador para o S3/R2 (Presigned URLs) exige que o servidor de destino (R2) diga ao navegador "Sim, eu aceito receber dados (PUT) vindos desse site". Sem essa configuração, o navegador bloqueia a requisição por segurança.
