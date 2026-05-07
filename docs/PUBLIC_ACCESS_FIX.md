# 🚨 Correção: Erro 401 Unauthorized (Visualização)

Você conseguiu fazer o upload! 🎉
Mas agora, ao tentar ver a imagem, apareceu o erro **401 Unauthorized**.

Isso acontece porque o **Acesso Público** (via subdomínio `r2.dev`) vem **desativado por padrão** no Cloudflare R2. Você precisa ativá-lo manualmente.

## Como Resolver (Passo a Passo)

1. **Acesse o Dashboard do Cloudflare**: [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Vá para **R2** no menu lateral.
3. Clique no bucket **`siges`**.
4. Clique na aba **Settings** (Configurações).
5. Role para baixo até encontrar a seção **Public Access**.
6. Existem duas opções de acesso público. Você está usando a URL `*.r2.dev`, então procure por:
   - **R2.dev Subdomain**
7. Clique no botão **Allow Access** (Permitir Acesso).
   - *Nota: Será solicitado confirmar escrevendo "allow".*

8. **Verifique a URL Pública:**
   - Após ativar, aparecerá uma URL como `https://pub-xxxxxxxxxxxx.r2.dev`.
   - Confirme se essa URL **combina** com a que você colocou no `.env.local` (`VITE_R2_PUBLIC_URL`).
   - Se for diferente, **atualize o `.env.local`**.

## Teste Final

Recarregue a página da imagem que deu erro. Ela deve aparecer imediatamente.
