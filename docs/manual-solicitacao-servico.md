# 📘 Manual Didático: Criação de Solicitação de Serviço (SS)

## 1. O que é uma Solicitação de Serviço?

Uma **Solicitação de Serviço (SS)** é o registro inicial de um problema ou necessidade de manutenção em uma unidade/cliente. A SS é a "mãe" de uma ou mais Ordens de Serviço (OS), que são geradas a partir dela para execução prática.

---

## 2. Acessando a Tela de Criação

A tela de criação pode ser acessada por:
- **Dashboard de Ordens** → botão "Nova SS"
- **Dashboard de Visitas** → botão "Nova SS"
- **Dashboard de Unidades/Ativos** → botão de criar SS
- **Detalhe de uma SS existente** → botão "Editar" ou "Clonar"

---

## 3. O Wizard de 4 Passos

O formulário é um **wizard progressivo** com 4 etapas:

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────┐    ┌────────────┐
│ 1. Localização │──▶│ 2. Detalhes do    │──▶│ 3. Verificação│──▶│ 4. Evidências│
│               │    │    Serviço        │    │  (Duplicatas)│    │   (Fotos)    │
└─────────────┘    └──────────────────┘    └──────────────┘    └────────────┘
```

---

## 4. Passo 1 — Localização

| Campo | Obrigatório | Descrição |
|-------|:-----------:|-----------|
| **Cliente** | ✅ | Seleciona o cliente/pessoa jurídica |
| **Unidade** | ✅ | Seleciona a unidade do cliente (depende do cliente selecionado) |
| **Setor > Posição** | ❌ | Localização exata dentro da unidade (depende da unidade) |

**Regras:**
- Ao trocar de cliente, a unidade e setor são resetados
- Ao trocar de unidade, o setor é resetado
- A unidade só fica habilitada após selecionar um cliente
- O setor só fica habilitado após selecionar uma unidade

**Fluxo de dependência:**
```
Cliente ──▶ Unidade ──▶ Setor > Posição
```

---

## 5. Passo 2 — Detalhes do Serviço

| Campo | Obrigatório | Descrição |
|-------|:-----------:|-----------|
| **Tipo de OS** | ✅ | Tipo do serviço (ex: Manutenção, Instalação, etc.) |
| **Prioridade** | ❌ | Nível de urgência |
| **Descrição do Problema** | ✅ | Mínimo de **10 caracteres**. Descreva o problema detalhadamente |

**Exemplo de descrição:**
```
Realizar vistoria, GMB01: Painel não liga, LED piscando vermelho intermitente
```

---

## 6. Passo 3 — Verificação de Duplicatas

O sistema **automaticamente** verifica se já existe uma SS com:
- Mesma unidade
- Mesmo setor/posição
- Mesmo tipo de serviço

**Cenários:**
| Situação | Ação do Sistema |
|----------|----------------|
| Nenhuma duplicata encontrada | Avança direto para o Passo 4 |
| Duplicatas encontradas | Exibe aviso com as SSs existentes |

**Se houver duplicatas**, o usuário pode:
- **Visualizar** uma SS existente (abre o detalhe)
- **Continuar** e criar uma nova SS mesmo assim
- **Voltar** ao Passo 2 para ajustar os dados

> ⚠️ Esta etapa é **pulada** no modo de edição de uma SS existente.

---

## 7. Passo 4 — Evidências (Fotos)

| Ação | Descrição |
|------|-----------|
| **Adicionar Foto** | Seleciona da galeria ou tira com a câmera |
| **Editar Foto** | Abre o editor de imagem para recortar/ajustar |
| **Excluir Foto** | Remove a foto selecionada |
| **Visualizar Foto** | Clique na foto para ampliar em tela cheia |

**Regras:**
- Máximo de **4 fotos**
- Formatos aceitos: imagens (via galeria ou câmera)
- As fotos são enviadas **após** a criação da SS no banco

---

## 8. Enviando a SS

Após preencher todos os passos, clique em **"Enviar"** (ou **"Salvar Edição"** se estiver editando).

### O que acontece nos bastidores:

```
1. Validação dos campos obrigatórios
         │
2. Resolução dos dados do usuário logado
   (empresa, departamento, equipe)
         │
3. Resolução dos dados da unidade
   (endereço, sistema, coordenadas GPS)
         │
4. Resolução do tipo e prioridade
         │
5. Geração do contador da SS
   (formato: {contador}.0.{ano} → ex: "42.0.2026")
         │
6. Inserção no banco de dados (tabela orders)
         │
7. Upload das fotos para armazenamento
         │
8. Redirecionamento para o detalhe da SS
```

### Formato da Máscara (order_mask)
```
{counter}.0.{year}

Exemplos:
  1.0.2026  → Primeira SS do ano 2026
  42.0.2026 → 42ª SS do ano 2026
```

---

## 9. Campos Armazenados no Banco

| Campo | Origem | Descrição |
|-------|--------|-----------|
| `parent_id` | Fixo `null` | Indica que é uma SS (não OS) |
| `status_id` | Fixo `1` | Status inicial (Aberta) |
| `client_id` | Formulário | ID do cliente |
| `unit_id` | Formulário | ID da unidade |
| `type_id` | Formulário | Tipo do serviço |
| `priority_id` | Formulário | Prioridade |
| `requested_services` | Formulário | Descrição do problema |
| `order_mask` | Gerado | Máscara da ordem |
| `company_id` | Usuário | Empresa do usuário logado |
| `requester_name` | Usuário | Nome de quem solicitou |
| `created_at` | Sistema | Data/hora no fuso Brasil |

---

## 10. Casos de Uso Especiais

### Editar uma SS
- Acesse o detalhe da SS → botão "Editar"
- O Passo 3 (Verificação) é pulado
- As fotos existentes podem ser mantidas ou alteradas

### Clonar uma SS
- Acesse o detalhe da SS → botão "Clonar"
- O modal pede a **unidade de destino**
- Os dados são copiados para a nova unidade

### Criar SS com Contexto
- Ao criar a partir de uma Unidade/Ativo/Tag, o formulário inicia no **Passo 2**
- Os dados de localização já estão pré-preenchidos

---

## 11. Validações e Erros

| Erro | Causa | Solução |
|------|-------|---------|
| "Preencha todos os campos obrigatórios" | Campos faltando | Preencha Cliente, Unidade, Tipo e Descrição |
| "A descrição deve ter pelo menos 10 caracteres" | Descrição curta | Escreva mais detalhes |
| "Erro ao salvar. Tente novamente." | Falha de conexão | Verifique a internet e tente novamente |
| "Máximo de 4 fotos permitido" | Limite de fotos | Remova uma foto antes de adicionar outra |

---

## 12. Fluxo Completo (Diagrama)

```
Início
  │
  ▼
[Passo 1: Localização]
  │ Cliente + Unidade + Setor
  ▼
[Passo 2: Detalhes]
  │ Tipo + Prioridade + Descrição
  ▼
[Passo 3: Verificar Duplicatas]
  │ ┌─ Duplicata? ─┬─ Sim → Avisar → Continuar ou Voltar
  │ │               └─ Não ──────────────────────┐
  ▼                                              │
[Passo 4: Evidências]  ◀─────────────────────────┘
  │ Fotos (0-4)
  ▼
[Enviar]
  │
  ├─→ Validar dados
  ├─→ Resolver dados do usuário/unidade
  ├─→ Gerar contador (order_mask)
  ├─→ Inserir no banco (orders)
  ├─→ Upload das fotos
  └─→ Redirecionar para Detalhe da SS
```

---

## 13. Dicas

1. **Descreva detalhadamente** — Quanto mais informações, mais rápido a equipe resolve
2. **Fotos ajudam** — Adjunte evidências do problema quando possível
3. **Verifique duplicatas** — Pode ser que o problema já tenha sido reportado
4. **Prioridade correta** — Use prioridade adequada para não sobrecarregar a equipe
