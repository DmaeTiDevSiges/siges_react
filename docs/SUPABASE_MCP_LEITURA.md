# Supabase MCP somente leitura — guia rápido

> Criado em 14/11/2026. **Contém IPs de servidor e pendências de segurança: não publicar fora do time.**
> A senha do usuário `claude_ro` não está aqui de propósito; fica só nas configurações do Claude Code.

## Resumo

O Claude Code consulta o banco de produção do SIGES, mas não consegue alterar nada: o acesso é só de
leitura e protegido pelo próprio banco.

Três peças fazem isso funcionar:

- **Usuário `claude_ro`** no Postgres: lê as tabelas do schema `public` (todas as linhas, com `bypassrls`),
  não vê o schema `auth` (senhas de login) e cancela consultas acima de 15 segundos.
- **Túnel SSH:** um cano criptografado do seu computador até o servidor do Supabase. O banco não é
  acessado direto pela internet.
- **MCP `supabase-ro`:** a ligação que o Claude Code usa para conversar com o banco por esse túnel.

Sem o túnel aberto, o MCP aparece como conectado, mas toda consulta falha com `ECONNRESET`.

## Uso no dia a dia

Antes de pedir qualquer coisa ao banco, abra o túnel e deixe o terminal aberto.

1. Abra um terminal (no VS Code: painel **Terminal**).
2. Rode o comando abaixo e digite a senha da VPS quando pedir. Nada aparece enquanto você digita.
3. Se funcionar, o terminal fica parado, sem mensagem. **Não feche** esse terminal.
4. Em uma conversa **aberta depois** de registrar o MCP, pergunte normalmente, por exemplo:
   "Liste as tabelas do banco usando o supabase-ro" ou "Quantas OS estão abertas?".

```bash
ssh -N -L 55432:127.0.0.1:5432 root@207.180.227.22
```

O túnel fecha quando você desliga o computador ou fecha o terminal. Nesse caso, repita o passo 2.

## Se der erro

| O que aparece | Causa provável | O que fazer |
| --- | --- | --- |
| `read ECONNRESET` nas consultas | Túnel fechado, ou apontando para a VPS errada | Abra o túnel com o comando acima. O IP certo é 207.180.227.22 (o 169.58.40.214 é a VPS do Hermes) |
| `Address already in use` ao abrir o túnel | Outro túnel esquecido ocupa a porta 55432 | Feche o terminal do túnel antigo (Ctrl+C) e abra de novo |
| `Permission denied, please try again` | Senha da VPS digitada errada | Rode o comando de novo e digite com calma |
| `claude: comando não encontrado` | O VS Code não instala o comando `claude` no terminal | Use o caminho completo do binário (tabela abaixo) |
| O MCP não aparece na conversa | Só carrega em conversas abertas depois do registro | Abra uma conversa nova no Claude Code |
| `Needs Auth` em `plugin:supabase:supabase` | É o plugin do Supabase Cloud, não serve para o seu servidor | Ignore. Use o `supabase-ro` |

## Dados da configuração

| Item | Valor |
| --- | --- |
| Servidor do Supabase | 207.180.227.22 (`vps.supabase.siges-app.com.br`), Postgres na porta 5432 |
| VPS do Hermes (outra máquina) | 169.58.40.214. Não usar para o banco |
| Usuário no banco | `claude_ro` (só leitura, lê todas as linhas do schema `public`) |
| Porta local do túnel | 55432 (a 54322 é o Supabase local de desenvolvimento) |
| Nome do MCP | `supabase-ro`, escopo de usuário |
| Pacote do MCP | `@modelcontextprotocol/server-postgres` |
| Binário do `claude` | `/home/edukmattos/.vscode/extensions/anthropic.claude-code-2.1.323-linux-x64/resources/native-binary/claude` (o número da versão muda quando a extensão atualiza) |

Para registrar o MCP de novo (por exemplo, depois de trocar a senha), troque `NOVA_SENHA` e rode:

```bash
/home/edukmattos/.vscode/extensions/anthropic.claude-code-2.1.323-linux-x64/resources/native-binary/claude mcp add --scope user supabase-ro -- npx -y @modelcontextprotocol/server-postgres "postgresql://claude_ro:NOVA_SENHA@localhost:55432/postgres"
```

## Pendências de segurança

A mais urgente é a porta 5432: hoje o Postgres do servidor responde para a internet inteira e sem
criptografia.

- [ ] **Testar a recusa de escrita.** Na conversa com o MCP, peça: "tente criar uma tabela chamada
  teste_escrita". Deve dar erro de `read-only transaction`.
- [ ] **Trocar a senha do `claude_ro`.** Ela apareceu em prints no chat. No Studio (SQL Editor):
  `alter role claude_ro password 'NOVA_LONGA';` (20 caracteres ou mais, só letras e números). Depois
  registre o MCP de novo com a nova senha.
- [ ] **Fechar a porta 5432 para a internet.** No firewall da VPS 207.180.227.22, liberar só o seu IP e o
  das máquinas que precisam. Antes, conferir se os scripts `db:export` e `db:restore` (que usam
  `SUPABASE_DB_HOST`) conectam direto nessa porta, porque eles passariam a precisar do túnel.
- [ ] **Túnel automático (opcional).** Gerar uma chave SSH, autorizar uma vez na VPS e configurar o
  túnel como serviço que sobe sozinho com o computador, para não precisar mais abrir o terminal.

## Como desfazer tudo

Se um dia não quiser mais o acesso, remova as três peças nesta ordem.

1. **Encerrar o túnel:** feche o terminal do `ssh -N` (Ctrl+C).
2. **Remover o MCP** do Claude Code:

   ```bash
   /home/edukmattos/.vscode/extensions/anthropic.claude-code-2.1.323-linux-x64/resources/native-binary/claude mcp remove supabase-ro --scope user
   ```

3. **Apagar o usuário do banco**, no SQL Editor do Studio:

   ```sql
   revoke all on all tables in schema public from claude_ro;
   revoke all on all sequences in schema public from claude_ro;
   alter default privileges in schema public revoke select on tables from claude_ro;
   revoke usage on schema public from claude_ro;
   revoke connect on database postgres from claude_ro;
   drop role claude_ro;
   ```

Para só suspender o acesso sem apagar nada, basta rodar `alter role claude_ro nologin;`.
