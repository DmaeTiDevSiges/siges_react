# 10 — Configurações do Sistema

> **Perfil:** Usuário (perfil próprio) • Gestor (equipe/departamento) • Admin/Super Admin (sistema global)  
> **Rota:** `/settings` → Abas: Perfil / Notificações / Ajustes / Admin (se Super Admin)  
> **Tabelas-chave:** `users`, `users_notifications`, `cfg_routes`, `cfg_profiles_access`, `cfg_features` (feature flags)

---

## 1. Visão Geral das Abas

| Aba | Quem Acessa | Conteúdo Principal |
|-----|-------------|-------------------|
| **Perfil** | Todos | Dados pessoais, foto, disponibilidade, senha, tema |
| **Notificações** | Todos | Histórico, preferências de canal (push/email/WhatsApp) |
| **Ajustes** | Gestor/Admin | Configurações do app, feature flags, logs |
| **Admin** | Super Admin | Usuários, Rotas, Perfis, Empresas, Cadastros globais |

---

## 2. Aba Perfil (`/settings/profile`)

### 2.1 Dados Pessoais
| Campo | Editável | Observação |
|-------|:--------:|------------|
| **Nome Completo** | ✅ | Usado em relatórios, assinaturas |
| **Nome Curto** | ✅ | Exibido no avatar, máscaras (ex: "João S.") |
| **E-mail** | 🔧 Admin | Login + notificações email |
| **Telefone** | ✅ | Com DDD; usado em OS/Visitas |
| **WhatsApp** | ✅ | Separado do telefone; para notificações WhatsApp |
| **CPF** | 🔧 Admin | Apenas leitura para usuário |
| **Cargo/Função** | ✅ | Livre (ex: "Técnico Elétrico") |
| **Veículo** | ✅ | Seleção de veículo cadastrado (para visitas) |

### 2.2 Foto do Perfil
- **Upload:** Clique no avatar → Galeria ou Câmera
- **Validação:** JPG/PNG/WebP, máx. 5MB, mín. 100×100px
- **Notificação:** Super Admin recebe aviso de troca (auditoria)
- **Storage:** `companies/{company_id}/users/{user_id}/avatar`

### 2.3 Disponibilidade Manual
- **Botão Toggle:** 🟡 Disponível ↔ ⚫ Indisponível
- **Campo:** `users.isAvailable` (boolean)
- **Efeito:** Altera cor do avatar (amarelo/cinza)
- **Não afeta** `ovIdInProgress` (automático em visita)

### 2.4 Senha e Segurança
- **Alterar Senha:** Atual + Nova + Confirmação
- **MFA (2FA):** Ativar/Desativar (TOTP - Google Authenticator, Authy)
- **Sessões Ativas:** Ver dispositivos logados → Revogar se necessário

### 2.5 Preferências de Interface
| Configuração | Opções | Padrão |
|--------------|--------|--------|
| **Tema** | Claro / Escuro / Sistema | Sistema |
| **Idioma** | PT-BR / EN / ES | PT-BR |
| **Formato Data** | DD/MM/YYYY / MM/DD/YYYY | DD/MM/YYYY |
| **Notificações Sonoras** | Ligado / Desligado | Ligado |
| **Vibração (mobile)** | Ligado / Desligado | Ligado |

---

## 3. Aba Notificações (`/settings/notifications`)

### 3.1 Centro de Notificações (`NotificationsList`)
- **Lista unificada:** Todas notificações recebidas (in-app)
- **Filtros:** Não lidas / Tipo / Período / Busca textual
- **Ações:** Marcar como lida (individual / todas), Excluir
- **Detalhe:** Clica → Abre entidade relacionada (OS, Visita, SS, etc.)

### 3.2 Tipos de Notificação
| Tipo | Origem | Exemplo |
|------|--------|---------|
| `OS em atendimento` | Visita iniciada | "João iniciou visita: OS 42.1.2026.01" |
| `OS autorizada` | Gestor autoriza OS | "OS 42.1.2026 autorizada para sua equipe" |
| `Visita para revisar` | Líder reportou | "Visita 42.1.2026.01 aguarda revisão técnica" |
| `Visita aprovada` | Contratante aprova | "Visita 42.1.2026.01 aprovada tecnicamente" |
| `Custos para aprovar` | Contratada enviou | "Visita 42.1.2026.01: custos submetidos" |
| `Almoxarifado: autorização` | Técnico solicitou | "Requisição #123 aguarda sua autorização" |
| `Almoxarifado: retirada` | Almoxarife separou | "Requisição #123 pronta para retirada" |
| `profile_photo_change` | Usuário trocou foto | "Maria atualizou foto do perfil" |

### 3.3 Preferências de Canal (Por Tipo)
| Tipo | Push (App) | E-mail | WhatsApp | In-App |
|------|:----------:|:------:|:--------:|:------:|
| OS/Visita (urgente) | ✅ | ✅ | ✅ | ✅ |
| Aprovações | ✅ | ✅ | ⭕ | ✅ |
| Almoxarifado | ✅ | ⭕ | ⭕ | ✅ |
| Sistema/Info | ✅ | ❌ | ❌ | ✅ |
| Foto perfil (admin) | ✅ | ✅ | ❌ | ✅ |

> ⭕ = Opcional (usuário escolhe) | ✅ = Sempre | ❌ = Nunca

### 3.4 Configuração por Usuário
1. Aba Notificações → **"Preferências"**
2. Para cada **Tipo**: marque/desmarque canais
3. **Horário Silencioso:** Defina período (ex: 22h-06h) → Push não vibra/toca
4. **Digest Diário:** Resumo único às 08h (opcional)

---

## 4. Aba Ajustes (`/settings/app`)

### 4.1 Configurações Gerais (Gestor/Admin)
| Configuração | Descrição |
|--------------|-----------|
| **Nome da Empresa** | Exibido no header, relatórios, e-mails |
| **Logo da Empresa** | Upload (PNG/SVG, máx. 200kb) |
| **Fuso Horário** | Padrão: America/Sao_Paulo (não alterar) |
| **Formato Máscara SS** | `{counter}.0.{year}` (não alterar) |
| **Formato Máscara OS** | `{parent}.{child}.{year}` (não alterar) |
| **Formato Máscara Visita** | `{os_mask}.{seq:02d}` (não alterar) |

### 4.2 Feature Flags (Chaves `cfg_features` / `.env`)
| Flag | Chave .env | Descrição | Padrão |
|------|------------|-----------|--------|
| Aprovação Financeira Visitas | `VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL` | Habilita aba custos + fluxo aprov. financeira | `false` |
| Calendário Matriz Ativos | `VITE_FEATURE_ASSETS_ORDERS_CALENDAR` | Habilita dashboard matriz ativos×meses | `true` |
| Disponibilidade Ativos | `VITE_FEATURE_ASSETS_AVAILABILITY` | Habilita módulo disponibilidade | `true` |
| Gamificação | `VITE_FEATURE_GAMIFICATION` | Pontuação, ranking, badges | `false` |
| IA Assistente Visita | `VITE_FEATURE_AI_VISIT_ASSISTANT` | Sugestões de texto via LLM | `false` |
| Modo Offline Avançado | `VITE_FEATURE_ENHANCED_OFFLINE` | Sync inteligente, conflitos | `true` |

> **Como alterar:** Edite `.env.local` ou `.env.production` → Rebuild + Deploy

### 4.3 Logs e Diagnóstico (Admin)
- **Logs de Erro:** Últimos 100 erros (frontend + backend via Supabase)
- **Performance:** Tempos de carregamento por tela
- **Sync Offline:** Status da fila local (pendentes, falhas, sincronizados)
- **Versão App:** Build number, commit hash, data build

---

## 5. Aba Admin (Super Admin apenas) — `/settings/admin`

### 5.1 Gestão de Usuários
| Ação | Descrição |
|------|-----------|
| **Listar Todos** | Filtros: empresa, departamento, equipe, status, perfil |
| **Criar Usuário** | Nome, e-mail, senha temporária, perfil, empresa, depto, equipe |
| **Editar** | Todos os campos + reset senha + forçar MFA |
| **Inativar/Reativar** | `is_available` (não exclui) |
| **Excluir (Soft)** | `is_deleted=true` + `deleted_at` + `deleted_user_id` |
| **Impersonar** | Entrar como usuário (auditoria) |

### 5.2 Rotas e Permissões (`cfg_routes` + `cfg_profiles_access`)

#### Rotas (`cfg_routes`)
| Campo | Descrição |
|-------|-----------|
| `route_key` | Chave única (ex: `orders_visits_costs_submit`) |
| `route_path` | Caminho no app (ex: `/orders/visits/costs`) |
| `description` | Nome amigável |
| `icon` | Ícone Material Design |
| `parent_id` | Rota pai (menu hierárquico) |
| `order_index` | Ordem no menu |
| `is_available` | Visível no menu |

#### Perfis de Acesso (`cfg_profiles_access`)
| Permissão | Valores |
|-----------|---------|
| `can_view` | Ver no menu + acessar rota |
| `can_create` | Botão "Novo" / Criar |
| `can_edit` | Editar registros |
| `can_delete` | Excluir/Inativar |

#### Matriz Padrão (Exemplo)
| Rota | Super Admin | Admin Empresa | Líder | Técnico |
|------|:-----------:|:-------------:|:-----:|:-------:|
| `dashboard` | ✅ | ✅ | ✅ | ✅ |
| `service_request` | ✅ | ✅ | ✅ | ✅ |
| `orders` | ✅ | ✅ | ✅ | ✅ |
| `visits` | ✅ | ✅ | ✅ | ✅ |
| `warehouse` | ✅ | ✅ | ⭕ | ✅ |
| `assets` | ✅ | ✅ | ✅ | ✅ |
| `teams` | ✅ | ✅ | ⭕ | ❌ |
| `settings_admin` | ✅ | ❌ | ❌ | ❌ |
| `orders_visits_financial_approve` | ✅ | ✅ | ❌ | ❌ |

> ⭕ = Configurável por empresa

### 5.3 Cadastros Globais (Super Admin)
| Cadastro | Tabela | Descrição |
|----------|--------|-----------|
| **Empresas** | `companies` | Multi-tenancy raiz |
| **Departamentos** | `cfg_departments` | Por empresa |
| **Tipos de OS** | `cfg_order_types` | Por empresa |
| **Subtipos OS** | `cfg_order_type_subs` | Por tipo + empresa |
| **Prioridades** | `cfg_priorities` | Global |
| **Status OS** | `cfg_statuses` | Global (1-9) |
| **Status Visita** | `cfg_visits_processing` | Global (1-5) |
| **Tags Ativos** | `cfg_assets_tags` / `_subs` | Global |
| **Materiais/Categorias** | `materials` / `materials_categories` | Global |
| **Almoxarifados** | `warehouses` | Por departamento |
| **Veículos** | `vehicles` | Por empresa |

### 5.4 Auditoria e Logs de Admin
- **Tabela:** `admin_audit_logs`
- **Campos:** `admin_user_id`, `action`, `target_table`, `target_id`, `old_values`, `new_values`, `ip`, `user_agent`, `created_at`
- **Ações logadas:** Criar/Editar/Excluir usuários, alterar permissões, feature flags, cadastros globais

---

## 6. Permissões por Perfil (Resumo)

| Funcionalidade | Super Admin | Admin Empresa | Líder | Técnico | Almoxarife |
|----------------|:-----------:|:-------------:|:-----:|:-------:|:----------:|
| Ver próprio perfil | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar próprio perfil | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver notificações | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configurar canais notif. | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tema/Idioma | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver dashboards gerenciais | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exportar relatórios | ✅ | ✅ | ✅ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gerenciar equipes/deptos | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configurar rotas/perfis | ✅ | ❌ | ❌ | ❌ | ❌ |
| Feature flags | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cadastros globais | ✅ | ❌ | ❌ | ❌ | ❌ |
| Auditoria admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| Almoxarifado (triagem) | ✅ | ✅ | ⭕ | ❌ | ✅ |
| Aprovar OS/Visitas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Aprovar Financeiro | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 7. Validações e Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "E-mail já cadastrado" | Tentou criar usuário com e-mail existente | Use outro e-mail ou reative usuário inativo |
| "Sem permissão para acessar" | Rota não liberada no `cfg_profiles_access` | Super Admin: adicione permissão ao perfil |
| "Feature não disponível" | Flag `VITE_FEATURE_...=false` | Ative no `.env` + rebuild |
| "Não consegue alterar senha" | Senha atual incorreta | Confirme senha atual; se esqueceu, peça reset ao Admin |
| "MFA não funciona" | Horário do celular dessincronizado | Sincronize hora automática (rede) no celular |
| "Notificação não chega" | Canal desmarcado nas preferências | Verifique Aba Notificações → Preferências |

---

## 8. Dicas e Boas Práticas

### Para Usuários
1. **Mantenha foto atualizada** — Ajuda identificação em visitas/OSs
2. **Configure WhatsApp** — Receba alertas urgentes mesmo com app fechado
3. **Use "Horário Silencioso"** — Evita perturbação fora do expediente
4. **Revogue sessões antigas** — Segurança: "Sessões Ativas" → Remover desconhecidas

### Para Gestores
1. **Padronize perfis por função** — Não dê Admin para quem só precisa de Líder
2. **Audite permissões trimestralmente** — Remove acessos de quem mudou de função
3. **Teste feature flags em homologação** — Antes de ativar em produção

### Para Super Admin
1. **Use "Impersonar" com parcimônia** — Só para debug/suporte; loga tudo
2. **Documente mudanças de permissão** — `admin_audit_logs` mostra, mas anote o motivo
3. **Backup antes de mexer em cadastros globais** — `pg_dump` ou exportação completa

---

## 9. Perguntas Frequentes (FAQ — Configurações)

| Pergunta | Resposta |
|----------|----------|
| **Como trocar a empresa no app?** | Perfil → "Trocar Contexto" → Seleciona empresa/departamento (se tiver acesso a múltiplas). |
| **Posso ter dois perfis no mesmo usuário?** | Não. Um usuário = um perfil. Para múltiplas funções, use equipes diferentes ou peça Admin para ajustar permissões. |
| **O que é "Rota" no sistema?** | Item de menu/navegação (ex: `/orders/visits/costs`). Controla o que aparece no menu lateral. |
| **Como criar um novo tipo de notificação?** | Requer dev: adicionar `type` no código + entrada em `cfg_routes` (se tiver tela) + permissões. |
| **Feature flag alterada não surtiu efeito** | Rebuild necessário: `npm run build` + deploy. No dev: `npm run dev` recarrega. |
| **Posso personalizar máscaras (SS/OS/Visita)?** | Não recomendado. São chaves de integração. Alteração = quebra relatórios, buscas, APIs. |

---

## 10. Links Relacionados

- [Cap. 01 — Introdução](./01-introducao.md) — Navegação, indicadores de disponibilidade
- [Cap. 04 — Visitas Técnicas](./04-visitas-tecnicas.md) — Feature flag aprovação financeira
- [Cap. 05 — Ativos e Equipamentos](./05-ativos-equipamentos.md) — Feature flags ativos/calendário
- [Cap. 08 — Equipes e Colaboradores](./08-equipes-colaboradores.md) — Gestão de usuários/equipes
- [Cap. 09 — Dashboard e Relatórios](./09-dashboard-relatorios.md) — Exportação, feature flags relatórios
- [Cap. 11 — Glossário](./11-faq-glossario.md) — Termos: feature flag, cfg_routes, cfg_profiles_access, MFA, TOTP