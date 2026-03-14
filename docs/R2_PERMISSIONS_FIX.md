v# 🚨 Correção Urgente: Permissões do Token R2 (Erro 403 Forbidden)

O erro `403 Forbidden` ou `PutObject AccessDenied` confirma que a chave de API que você está usando (`VITE_R2_ACCESS_KEY_ID`) **não tem permissão de escrita** no bucket. Ela provavelmente tem apenas permissão de leitura.

## Como Resolver (Passo a Passo)

Você precisa gerar um **NOVO Token de API** com as permissões corretas no Cloudflare.

1. **Acesse o Dashboard do Cloudflare**: [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Vá para **R2** no menu lateral.
3. No painel direito (geral do R2, não dentro do bucket), clique em **Manage R2 API Tokens**.
4. Clique em **Create API Token**.
5. **Configuração Importante:**
   - **Token Name:** Siges Write Access (ou algo descritivo)
   - **Permissions (CRUCIAL):** Selecione **Admin Read & Write** ou **Object Read & Write**.
   - ⚠️ **NÃO SELECIONE apenas "Object Read" (padrão). Isso causará erro 403.**
   - **Specific Bucket(s):** Pode selecionar apenas o bucket `siges` ou "All buckets".
   - **TTL:** Forever (ou conforme sua política).

6. Clique em **Create API Token**.

## Atualizando o Projeto

7. Copie as novas credenciais geradas:
   - **Access Key ID**
   - **Secret Access Key**

8. Abra o arquivo `.env.local` no seu projeto.
9. Substitua os valores antigos pelos novos:

```env
VITE_R2_ACCESS_KEY_ID=sua_nova_access_key
VITE_R2_SECRET_ACCESS_KEY=sua_nova_secret_key
```

10. **Reinicie o servidor de desenvolvimento**:
    - Pare o `npm run dev` (Ctrl+C).
    - Rode novamente `npm run dev`.

## Teste Final

Tente fazer o upload novamente. Deve funcionar imediatamente.

---

### Resumo do Diagnóstico
O script de verificação confirmou que sua chave atual falha ao tentar criar arquivos (Escrita), embora possa conseguir listar arquivos (Leitura). Isso é típico de tokens criados com a permissão padrão "Object Read Only".
