# 11 — FAQ Consolidado e Glossário

> **Como usar:** Busque por termo (Ctrl+F) ou navegue pelas seções.  
> **Referência cruzada:** Cada entrada indica o capítulo principal [Cap. XX].

---

## Parte A — FAQ Consolidado (Por Tema)

### 🔐 Acesso e Login

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| Esqueci a senha | Peça reset ao Admin ou use "Esqueci senha" no login | [10] |
| MFA (2FA) não funciona | Sincronize horário do celular (rede automática) | [10] |
| Como trocar de empresa/contexto | Perfil → "Trocar Contexto" → Selecione | [01, 10] |
| Sessão expirou muito rápido | Configurado no backend (padrão 24h). Admin ajusta. | [10] |
| Posso usar em dois celulares? | Sim, mas só uma sessão ativa por dispositivo. | [10] |

### 📱 App Móvel / Offline

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| Funciona sem internet? | Sim (leitura + criação em fila). Sincroniza ao voltar online. | [01, 02, 04, 07] |
| Fotos ficam salvas offline? | Sim, no cache local. Upload automático ao conectar. | [02, 04] |
| Como instalar no celular? | Chrome/Edge → Menu → "Instalar app" / PWA. Ou loja (Capacitor). | [01] |
| GPS não funciona na visita | Ative localização no app E no celular. Permita "Sempre". | [04, 06] |
| App travou / fecha sozinho | Force close → Reabra. Se persistir: limpe cache/dados ou reinstale. | — |

### 📝 Solicitações de Serviço (SS)

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| SS vira OS automático? | Não. Gestor acessa SS → "Gerar OS". | [02, 03] |
| Quantas OS por SS? | Ilimitadas (contador filho: .1, .2, .3...). | [03] |
| Posso apagar SS? | Não. Só cancelar (status = Cancelada) com justificativa. | [02] |
| Foto some depois de enviar? | Não. Ficam no storage: `companies/{id}/orders/{id}/images`. | [02] |
| Descrição mínima 10 chars | Regra fixa. Escreva mais detalhes. | [02] |

### 🔧 Ordens de Serviço (OS)

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| Técnico pode criar OS? | Não. Só Gestor/Líder/Admin com permissão `orders_create`. | [03] |
| Como mudar equipe da OS? | OS Autorizada → "Encaminhar" → Seleciona nova equipe. | [03] |
| OS cancelada volta pra SS? | SS fica como estava. Pode gerar nova OS depois. | [03] |
| Prioridade OS ≠ SS? | Sim, editável na criação da OS. | [03] |
| O que é "Objeto/Equipamento"? | Item do catálogo `cfg_objects` (Bomba, Painel, Chiller...). | [03] |

### 📅 Visitas Técnicas

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| Várias visitas na mesma OS? | Sim. Máscara: `{OS}.01`, `{OS}.02`, `{OS}.03`... | [04] |
| Posso editar visita após "Aprovada"? | Não. Só se Contratante rejeitar (volta para Rascunho). | [04] |
| Materiais baixam do estoque na hora? | Sim, ao reportar (trigger `BAIXA_VISITA` no banco). | [04, 07] |
| Veículo é obrigatório? | Não. Só se usuário tem `vehicle_id` cadastrado. | [04] |
| Como adicionar mais técnicos? | Líder edita visita → Aba "Equipe" → "Adicionar Membro". | [04] |
| Processing vs Status OS? | `processing`=estado do relatório (1-5). `status_id` OS=5 enquanto houver visita aberta. | [04] |

### 🏷️ Ativos e Equipamentos

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| Posso mudar Tag de ativo? | Não direto. Desative (`is_active=false`) e crie novo. | [05] |
| Coeficientes somam > 100%? | Sistema bloqueia. Ajuste para total ≤ 1.0 por tag/unidade. | [05] |
| Disponibilidade é tempo real? | Sim, lendo cache `cfg_units_assets_tags.last_is_available`. | [05] |
| Offline registra disponibilidade? | Sim. Sincroniza ao voltar online. | [05] |
| QR Code e NFC são iguais? | Não. QR=câmera, NFC=aproximação. Podem coexistir. | [05] |
| Sub-tipo OS (PRV/COR) vem de onde? | `cfg_order_type_subs.code` — cadastro de tipos de OS. | [05] |

### 📦 Almoxarifado

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| Posso editar após enviar? | Não. Só status ABERTO (rascunho) é editável. | [07] |
| Técnico vê estoque? | Não por padrão. Permissão `warehouse_stock_view` controla. | [07] |
| Como ver o que técnico tem? | `/warehouse` → "Custódia" → Filtra por técnico. | [07] |
| Entrada NF atualiza preço médio? | Sim, automático via trigger CMP ao concluir. | [07] |
| Transferência entre empresas? | Não direto. Use: Saída (emp A) + Entrada (emp B) com NF. | [07] |
| O que é Ficha Kardex? | Histórico completo de movimentos de um material. | [07] |

### 👥 Equipes e Colaboradores

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| Usuário em duas equipes? | Não. `team_id` único. Use "Encaminhar OS" ou membro extra na visita. | [08] |
| Como definir líder da equipe? | Quem inicia visita = líder (`is_leader=true` em `orders_visits_teams`). | [08] |
| Mover usuário de equipe? | Sim (Admin): Editar usuário → Trocar `team_id`. | [08] |
| Excluir equipe apaga usuários? | `ON DELETE CASCADE`: usuários ficam `team_id=NULL`. Histórico preservado. | [08] |
| "Em Atividade" (verde) é auto? | Sim. Inicia visita → `ovIdInProgress` → vira verde. Finaliza → reseta. | [08] |
| Quem está livre agora? | `/teams` → Aba "Disponibilidade" → Filtra "Disponíveis" (amarelo). | [08] |

### 📊 Dashboard e Relatórios

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| Dashboard customizado? | Não na interface. Admin cria view SQL + componente React. | [09] |
| Relatório "OSs por técnico"? | Ordens Admin → Filtra `requester_team_id`/`team_id` → Exporta CSV. | [09] |
| Dados são tempo real? | Sim (Supabase Realtime). Pull-to-refresh força atualização. | [09] |
| Agendar envio por e-mail? | Ainda não (roadmap). Workaround: cron + `npm run db:export`. | [09] |
| Exportar TODOS os dados? | SSH tunnel + `npm run db:export` (guia em `dev/docs/EXPORTACAO_COMPLETA_GUIA.md`). | [09] |
| "Ordens Admin" vs "Ordens Usuário"? | Admin=todas+ações gerenciais. Usuário=sua equipe+ações operacionais. | [09] |

### ⚙️ Configurações

| Pergunta | Resposta Rápida | Capítulo |
|----------|-----------------|----------|
| Trocar empresa no app? | Perfil → "Trocar Contexto" → Seleciona (se acesso múltiplo). | [10] |
| Dois perfis no mesmo usuário? | Não. Um usuário = um perfil. Use equipes/permissões. | [10] |
| O que é "Rota"? | Item de menu (ex: `/orders/visits/costs`). Controla menu lateral. | [10] |
| Criar novo tipo notificação? | Requer dev: `type` no código + `cfg_routes` + permissões. | [10] |
| Feature flag não surtiu efeito | Rebuild: `npm run build` + deploy. Dev: `npm run dev` recarrega. | [10] |
| Personalizar máscaras SS/OS? | Não recomendado. Chaves de integração. Quebra relatórios, APIs. | [10] |

---

## Parte B — Glossário Técnico (A-Z)

| Termo | Definição | Capítulo |
|-------|-----------|----------|
| **asset_available_rate** | Coeficiente de participação do ativo (0.0 a 1.0). Peso na disponibilidade do setor. | [05] |
| **asset_tag / asset_tag_sub** | Tag (categoria) e Sub-Tag (subcategoria) de ativos. Ex: "Bombeamento" / "Bomba Centrífuga". | [05] |
| **BAIXA_VISITA** | Tipo de movimentação de almoxarifado: consumo de materiais em visita técnica. | [04, 07] |
| **cfg_features** | Tabela/arquivo de feature flags (liga/desliga funcionalidades sem deploy). | [10] |
| **cfg_profiles_access** | Tabela de permissões: qual perfil pode `view/create/edit/delete` cada rota. | [10] |
| **cfg_routes** | Tabela de rotas/menus do sistema: `route_key`, `route_path`, hierarquia, ícone. | [10] |
| **CMP** | Custo Médio Ponderado. Recalculado automaticamente a cada `ENTRADA` concluída. | [07] |
| **CUSTÓDIA** | Materiais sob responsabilidade temporária do técnico (`users_materials`). | [07] |
| **DEVOLUCAO** | Tipo de movimentação: técnico devolve material ao almoxarifado. | [07] |
| **ENTRADA** | Tipo de movimentação: nota fiscal / compra entra no estoque (direto CONCLUIDA). | [07] |
| **isAvailable** | Flag manual do usuário (Disponível/Indisponível). Controla cor do avatar (amarelo/cinza). | [01, 08] |
| **Kardex** | Ficha completa de movimentos de um material (entradas, saídas, saldos, custos). | [07] |
| **MFA / 2FA / TOTP** | Autenticação de dois fatores (Google Authenticator, Authy, etc.). | [10] |
| **ov_costs_status** | Status financeiro da visita: `pending` → `submitted` → `approved` / `rejected`. | [04] |
| **ovIdInProgress** | ID da visita em andamento (auto). Define cor verde no avatar + indisponibilidade. | [01, 04, 08] |
| **ov_mask** | Máscara da visita: `{OS.mask}.{seq:02d}` (ex: `42.1.2026.01`). | [04] |
| **ov_processing_id** | Status técnico do relatório da visita: 1-Rascunho, 2-Reportada, 3-Revisada, 4-Rejeitada, 5-Aprovada. | [04] |
| **parent_id** | FK em `orders`: `null`=SS (mãe), `SS.id`=OS (filha). | [02, 03] |
| **processing** | Sinônimo de `ov_processing_id` (estado do relatório da visita). | [04] |
| **Rascunho (processing=1)** | Visita criada, preenchendo relatório. Editável pelo líder. | [04] |
| **Reportada (processing=2)** | Líder enviou para revisão. Não editável (só se rejeitada). | [04] |
| **Revisada (processing=3)** | Supervisor Contratada aprovou tecnicamente. | [04] |
| **Rejeitada (processing=4)** | Supervisor/Contratante rejeitou → volta para líder corrigir. | [04] |
| **Aprovada (processing=5)** | Contratante aprovou tecnicamente. Libera fase financeira. | [04] |
| **SAIDA** | Tipo de movimentação: retirada de material do almoxarifado (ciclo 6 etapas). | [07] |
| **Soft Delete** | `is_deleted=true` + `deleted_at` + `deleted_user_id` — preserva histórico. | [05, 07, 08] |
| **SS / OS / Visita** | Solicitação de Serviço → Ordem de Serviço → Visita Técnica (hierarquia 1:N:N). | [01, 02, 03, 04] |
| **TRANSFERENCIA_ALMOX** | Tipo de movimentação: move material entre almoxarifados (ciclo 6 etapas). | [07] |
| **ViaCEP** | API brasileira de CEP → preenche endereço automaticamente. | [06] |

---

## Parte C — Códigos de Status (Referência Rápida)

### orders.status_id (OS/SS)

| ID | Código | Label | Contexto |
|----|--------|-------|----------|
| 1 | NP | Não Programada | SS inicial |
| 2 | AV | Em Avaliação | OS recém-criada |
| 3 | AU | Autorizada | OS com equipe designada |
| 4 | AG | Agendada | Equipe assumiu/encaminhou |
| 5 | EX | Em Andamento | Visita aberta (check-in) |
| 6 | AP | Aprovada | Pós-aprovações técnica+financeira |
| 7 | RE | Rejeitada | Qualquer rejeição no fluxo |
| 8 | CO | Concluída | Finalizada + arquivável |
| 9 | AR | Arquivada | Encerramento definitivo |

### orders_visits.ov_processing_id (Relatório da Visita)

| ID | Label | Quem Move |
|----|-------|-----------|
| 1 | Rascunho | Líder (auto ao criar) |
| 2 | Reportada | Líder (botão "Reportar") |
| 3 | Revisada | Supervisor Contratada |
| 4 | Rejeitada | Supervisor ou Contratante |
| 5 | Aprovada | Contratante (aprovação técnica) |

### orders_visits.ov_costs_status (Financeiro — Feature Flag)

| Valor | Label | Quem Move |
|-------|-------|-----------|
| `pending` | Aguardando Custos | — (inicial) |
| `submitted` | Custos Enviados | Contratada (Líder/Supervisor) |
| `approved` | Financeiro Aprovado | Contratante |
| `rejected` | Custos Rejeitados | Contratante |

### materials_movements.status (Almoxarifado)

| Valor | Label | Ciclo |
|-------|-------|-------|
| `ABERTO` | Rascunho | Montando lista |
| `AGUARDANDO_AUTORIZACAO` | Aguardando Autorização | Enviado p/ gestor |
| `AUTORIZADA` | Autorizada | Gestor aprovou |
| `EM_SEPARACAO` | Em Separação | Almoxarife separando |
| `AGUARDANDO_RETIRADA` | Aguardando Retirada | No balcão |
| `CONCLUIDA` | Concluída | Entregue + estoque atualizado |
| `CANCELADA` | Cancelada | Qualquer etapa |

---

## Parte D — Máscaras e Formatos

| Entidade | Formato | Exemplo | Regra |
|----------|---------|---------|-------|
| **SS** | `{counter}.0.{year}` | `42.0.2026` | Contador por empresa+ano |
| **OS** | `{SS.counter}.{child}.{year}` | `42.1.2026` | Filho incrementa por SS |
| **Visita** | `{OS.mask}.{seq:02d}` | `42.1.2026.01` | Sequencial por OS |
| **Data/Hora** | ISO 8601 BR | `2026-09-07T14:30:00-03:00` | Fuso America/Sao_Paulo |
| **CNPJ** | `xx.xxx.xxx/xxxx-xx` | `12.345.678/0001-90` | Máscara brasileira |
| **Telefone** | `(xx) xxxxx-xxxx` | `(11) 99999-8888` | Com DDD |
| **CEP** | `xxxxx-xxx` | `01234-567` | ViaCEP |

---

## Parte E — Atalhos de Teclado / Gestos

| Ação | Web / Desktop | Mobile (App) |
|------|---------------|--------------|
| Nova SS | `Alt + N` | Botão flutuante "+" |
| Buscar | `Ctrl + K` / `Cmd + K` | Lupa no header |
| Atualizar (Pull) | `F5` / `Ctrl + R` | Puxe lista para baixo |
| Voltar | `Alt + ←` / `Backspace` | Botão "Voltar" / Swipe right |
| Notificações | `Alt + Shift + N` | Badge no header / Perfil |
| Perfil | `Alt + P` | Avatar no header |
| Tema (toggle) | `Alt + T` | Settings → Tema |

---

## Parte F — Contatos e Escalação

| Situação | Quem Procurar | Canal |
|----------|---------------|-------|
| Dúvida operacional (como fazer) | Este manual (Ctrl+F) / Colega experiente | Chat interno |
| Bug / Erro do sistema | Suporte Técnico | Canal #suporte-siges / E-mail |
| Permissão negada | Seu Gestor → Admin | Chat / E-mail |
| Sugestão de melhoria | Product Owner / Tech Lead | Issue no GitHub / Reunião |
| Treinamento formal | Gestor da área / RH | Agenda |
| Emergência produção (sistema parado) | Plantão TI / Super Admin | WhatsApp plantão / Ligação |

---

## Parte G — Índice Remissivo (Capítulos)

| Capítulo | Título | Página Inicial (PDF) |
|----------|--------|---------------------|
| 01 | Introdução ao SIGES | 3 |
| 02 | Solicitações de Serviço (SS) | 7 |
| 03 | Ordens de Serviço (OS) | 15 |
| 04 | Visitas Técnicas | 23 |
| 05 | Ativos e Equipamentos | 35 |
| 06 | Unidades e Clientes | 45 |
| 07 | Almoxarifado e Estoque | 53 |
| 08 | Equipes e Colaboradores | 63 |
| 09 | Dashboard e Relatórios | 71 |
| 10 | Configurações do Sistema | 79 |
| 11 | FAQ e Glossário (este) | 87 |

---

> **Fim do Manual.**  
> **Versão:** 1.0.0 — Setembro 2026  
> **Próxima revisão:** Conforme novas features (feature flags) ou mudanças de fluxo.  
> **Mantenha atualizado:** Edite o `.md` correspondente no repo → PR → Deploy → PDF regenerado automaticamente via GitHub Actions.