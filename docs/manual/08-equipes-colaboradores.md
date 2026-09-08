# 08 — Equipes e Colaboradores

> **Perfil:** Gestor/Líder (gestão) • Admin (configuração completa) • Todos (visualização de disponibilidade)  
> **Rota:** `/teams` → Departamentos / Equipes / Colaboradores / Disponibilidade  
> **Tabelas-chave:** `cfg_departments`, `cfg_teams`, `users`, `users_notifications`

---

## 1. Estrutura Organizacional

### Hierarquia
```
Empresa (company_id)
    └── Departamento (cfg_departments)
          ├── Equipe A (cfg_teams)
          │     ├── Colaborador 1 (users)
          │     ├── Colaborador 2 (users)
          │     └── ...
          ├── Equipe B (cfg_teams)
          └── ...
```

### Regras Fundamentais
| Regra | Descrição |
|-------|-----------|
| **1 Equipe = 1 Departamento** | `cfg_teams.department_id` (FK obrigatória) |
| **1 Colaborador = 1 Equipe** | `users.team_id` (FK) |
| **Cascata** | Excluir departamento → exclui equipes → usuários ficam sem equipe |
| **Escopo** | Tudo filtrado por `company_id` do usuário logado |

---

## 2. Departamentos (`cfg_departments`)

### O que é
Unidade organizacional que agrupa equipes. Ex: "Operação", "Manutenção", "Engenharia", "Administrativo".

### Gestão (Gestor/Admin)
- **Criar:** Nome, código, descrição, status (ativo/inativo)
- **Editar:** Todos os campos
- **Inativar:** `is_available = false` (preserva histórico)
- **Excluir:** Só se **sem equipes** vinculadas

### Vinculação com Contratos
- `contracts.client_department_id` → Define qual departamento do cliente gerencia o contrato
- Filtra contratos visíveis por departamento do usuário logado

---

## 3. Equipes (`cfg_teams`)

### Campos
| Campo | Obrigatório | Descrição |
|-------|:-----------:|-----------|
| **Nome** | ✅ | Ex: "Equipe Manutenção Elétrica" |
| **Código** | ✅ | Curto, único por empresa (ex: "MAN-ELT") |
| **Departamento** | ✅ | Seleção obrigatória (dropdown) |
| **Status** | ✅ | Ativo / Inativo |

### 3 Formas de Associar Equipe a Departamento

#### 1. Criar Nova Equipe no Departamento (Recomendado)
1. Navegue até o **Departamento** desejado
2. Aba "Equipes" → Botão **"+"**
3. Preencha: Nome, Código, Status
4. Salva → Já vinculada ao departamento atual

#### 2. Mover Equipe Existente (Editar)
1. No departamento **atual** da equipe → Aba "Equipes"
2. Clique na equipe → **"Editar"**
3. Troque o campo **"Departamento"** para o novo
4. Salva → Equipe movida

#### 3. Criar Equipe Escolhendo Departamento
1. Botão global "Nova Equipe" (fora de departamento específico)
2. Preencha dados + **Selecione Departamento** no dropdown
3. Salva

> ⚠️ **Validação:** Departamento é **obrigatório** — não salva sem.

---

## 4. Colaboradores (`users`)

### Vinculação à Equipe
- Campo `users.team_id` (FK → `cfg_teams.id`)
- Definido no **cadastro do usuário** ou **edição de perfil** (Admin)
- Um usuário **só pode ter 1 equipe** ativa

### Perfis de Usuário (Hierarquia)
| Perfil | Descrição | Permissões-chave |
|--------|-----------|------------------|
| **Super Admin** | Acesso total ao sistema | Tudo + Configurações globais |
| **Admin Empresa** | Gestão da empresa | Usuários, Equipes, Relatórios |
| **Líder de Equipe** | Gerencia sua equipe | Aprova visitas, Encaminha OS, Ver custódia |
| **Usuário Padrão** | Executa tarefas | Cria SS, Reporta visitas, Solicita materiais |

### Disponibilidade (Indicador Visual no Avatar)

| Cor | Label | Condição Técnica |
|-----|-------|------------------|
| 🟢 **Verde** | Em Atividade | `isAvailable = true` E `ovIdInProgress > 0` |
| 🟡 **Amarelo** | Disponível | `isAvailable = true` E `ovIdInProgress = 0` |
| ⚫ **Cinza** | Indisponível | `isAvailable = false` E `ovIdInProgress = 0` |

### Controle Manual de Disponibilidade
- Usuário altera no **Perfil** → Botão "Disponível/Indisponível"
- `users.isAvailable` (boolean) — controle manual
- `users.ovIdInProgress` (auto) — preenchido ao iniciar visita

---

## 5. Disponibilidade em Visita (Automático)

Ao **iniciar visita** (Cap. 04), o sistema atualiza **automaticamente** todos os membros da equipe:

| Campo | Valor Definido |
|-------|----------------|
| `ov_id_in_progress` | ID da visita em andamento |
| `is_available` | `false` |
| `is_ov_in_progress` | `true` |
| `o_id_in_progress` | ID da OS |
| `op_id_in_progress` | ID da SS (parent) |
| `ov_id_in_progress_mask` | Máscara da visita (ex: `42.1.2026.01`) |

Ao **finalizar visita** → Campos resetados (disponível novamente).

---

## 6. Gestão de Equipes (Interface `/teams`)

### Abas Principais

| Aba | Conteúdo | Ações |
|-----|----------|-------|
| **Departamentos** | Lista de departamentos + KPIs (qtd equipes, qtd usuários) | Criar/Editar/Inativar depto |
| **Equipes** | Grid de equipes por departamento | Criar/Editar/Mover/Excluir equipe |
| **Colaboradores** | Lista de usuários com equipe, disponibilidade, status | Ver detalhes, Editar perfil (Admin) |
| **Disponibilidade** | Mapa visual: quem está livre, em visita, indisponível | Filtro por equipe/depto |

### Filtros Comuns
- Por Departamento
- Por Status (Ativo/Inativo)
- Por Disponibilidade (Disponível / Em Visita / Indisponível)
- Busca textual (nome, código, e-mail)

---

## 7. Operações via API (Referência Técnica)

```typescript
// Criar equipe
await dataService.createTeam({
    name: 'Nome da Equipe',
    code: 'CODIGO',
    departmentId: 'ID_DEPARTAMENTO',
    status: 'active'
});

// Atualizar equipe (inclui mover departamento)
await dataService.updateTeam('ID_EQUIPE', {
    name: 'Novo Nome',
    code: 'NOVO_CODIGO',
    departmentId: 'NOVO_ID_DEPARTAMENTO',
    status: 'active'
});

// Excluir equipe
await dataService.deleteTeam('ID_EQUIPE');

// Listar equipes de um departamento
const teams = await dataService.getTeamsByDepartment('ID_DEPARTAMENTO');

// Listar todas as equipes
const teams = await dataService.getTeams();
```

---

## 8. Notificações de Equipe

### Cenários Automáticos
| Evento | Quem Recebe | Canal |
|--------|-------------|-------|
| OS Autorizada para equipe | Líder + Membros | Push + In-app |
| Visita Iniciada (líder) | Seguidores da OS | Push + In-app + WhatsApp (se configurado) |
| Solicitação Almoxarifado | Gestor do departamento | In-app |
| Convite para visita | Membros da equipe | Push + In-app |

### Configuração
- `/settings` → "Notificações" → Por tipo de evento
- Perfil controla: `can_receive_push`, `can_receive_whatsapp`, `can_receive_email`

---

## 9. Regras de Negócio Importantes

| Regra | Impacto |
|-------|---------|
| **Equipe sem departamento = erro** | Validação no frontend + constraint FK no banco |
| **Excluir departamento cascata** | `ON DELETE CASCADE` → equipes + usuários (team_id = null) |
| **Código único por empresa** | `cfg_teams.code` + `company_id` unique |
| **Líder = is_leader em orders_visits_teams** | Definido ao iniciar visita (usuário logado = líder) |
| **Membros da visita = equipe do líder + disponíveis** | Loop em `users` onde `team_id = líder.team_id` E `is_available = true` |
| **Disponibilidade manual vs automática** | `isAvailable` (manual) + `ovIdInProgress` (auto) = estado final |

---

## 10. Validações e Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Departamento obrigatório" | Criou equipe sem selecionar depto | Selecione departamento no dropdown |
| "Código já existe" | `code` duplicado na empresa | Use código único (ex: prefixo depto: `OP-MAN-01`) |
| "Não pode excluir: possui equipes" | Tentou excluir depto com equipes | Mova ou exclua as equipes primeiro |
| "Usuário sem equipe" | `team_id` nulo | Edite usuário → Vincule a equipe |
| "Líder não encontrado para visita" | Usuário logado sem `team_id` | Corrija cadastro do usuário (Admin) |
| "Membro não aparece na visita" | `is_available = false` ou `team_id` diferente | Verifique disponibilidade e equipe do usuário |

---

## 11. Dicas e Boas Práticas

### Para Organização
1. **Códigos padronizados** — Prefixo do departamento: `OP-` (Operação), `MN-` (Manutenção), `AD-` (Admin)
2. **Equipes pequenas (5-10 pessoas)** — Facilita gestão e escalação de visitas
3. **Um líder por equipe** — Defina no cadastro ou na visita (quem inicia = líder)

### Para Gestão Diária
1. **Monitore "Disponibilidade"** — Mapa visual mostra capacidade real da equipe
2. **Use "Encaminhar OS"** — Se equipe cheia, encaminhe para outra (Cap. 03)
3. **Notificações certas** — Evite spam: configure só eventos críticos por WhatsApp

### Para Administração
1. **Inative, não exclua** — Preserva histórico de OSs/visitas
2. **Audite `team_id` dos usuários** — Usuários sem equipe não entram em visitas
3. **Revise departamentos trimestralmente** — Reorganize conforme demanda

---

## 12. Perguntas Frequentes (FAQ — Equipes/Colaboradores)

| Pergunta | Resposta |
|----------|----------|
| **Um usuário pode estar em duas equipes?** | Não. `users.team_id` é único. Para atuação temporária, use "Encaminhar OS" ou adicione como membro extra na visita (`orders_visits_teams`). |
| **Como definir líder da equipe?** | Não há campo "líder" na equipe. Na visita, **quem inicia = líder** (`is_leader=true` em `orders_visits_teams`). |
| **Posso mover usuário de equipe?** | Sim (Admin): Editar usuário → Trocar `team_id`. Histórico preservado. |
| **O que acontece se excluir equipe?** | `ON DELETE CASCADE`: usuários ficam com `team_id = NULL`. Movimentações antigas mantêm `team_id` original. |
| **Disponibilidade "Em Atividade" (verde) é automática?** | Sim. Ao iniciar visita, sistema marca `ovIdInProgress` → vira verde. Ao finalizar, reseta. |
| **Como ver quem está livre agora?** | `/teams` → Aba "Disponibilidade" → Filtra "Disponíveis" (amarelo). |

---

## 13. Recursos Futuros (Roadmap)

- 🚧 **Adicionar membros às equipes** (interface dedicada)
- 🚧 **Histórico de mudanças de equipe** (auditoria de `team_id`)
- 🚧 **Mover múltiplas equipes de uma vez** (lote)
- 🚧 **Arquivar equipes** (em vez de excluir)
- 🚧 **Escala de plantão** (calendário de disponibilidade programada)
- 🚧 **Competências/Habilidades por usuário** (match com tipo de OS)

---

## 14. Links Relacionados

- [Cap. 03 — Ordens de Serviço](./03-ordens-servico.md) — Autorização designa equipe
- [Cap. 04 — Visitas Técnicas](./04-visitas-tecnicas.md) — Iniciar visita usa equipe + disponibilidade
- [Cap. 07 — Almoxarifado](./07-almoxarifado.md) — Solicitações filtradas por departamento
- [Cap. 10 — Configurações](./10-configuracoes.md) — Permissões `teams_*`, `users_*`, notificações
- [Cap. 11 — Glossário](./11-faq-glossario.md) — Termos: department_id, team_id, isAvailable, ovIdInProgress