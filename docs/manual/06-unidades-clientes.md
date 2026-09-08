# 06 — Unidades e Clientes

> **Perfil:** Todos (consulta) • Gestor/Admin (cadastro, edição)  
> **Rota:** `/units` → Lista / Busca / Detalhe / Cadastro  
> **Tabelas-chave:** `units`, `clients` (via `units.client_id`), `cfg_units_assets_tags`, `contracts`

---

## 1. Conceitos: Cliente vs Unidade

| Entidade | Descrição | Exemplo |
|----------|-----------|---------|
| **Cliente** | Pessoa jurídica contratante (empresa) | "Companhia de Saneamento XYZ" |
| **Unidade** | Instalação física do cliente | "ETA Central", "Estação Elevatória Sul" |

### Relacionamento
```
Cliente (1) ───▶ (N) Unidades
```
- Um cliente pode ter **múltiplas unidades**
- Cada unidade pertence a **um único cliente**
- SS/OS/Visitas sempre vinculadas a **Unidade** (que resolve o Cliente)

---

## 2. Como Acessar

| Origem | Ação |
|--------|------|
| **Bottom Navigation** | Ícone 🏢 "Unidades" (sempre visível) |
| **Dashboard** | Card "Unidades" → "Ver Todas" |
| **Contexto de SS/OS** | Detalhe → Link para Unidade |
| **Busca Global** | Digita nome/código da unidade |

---

## 3. Lista de Unidades (UnitsSearch)

### Layout
- **Cards** com informações hierárquicas alinhadas à esquerda
- **Scroll infinito** (paginação automática ao rolar)
- **Busca textual** (nome, endereço, status)
- **Filtros** (status, cliente, sistema)
- **Ordenação** por nome (A-Z / Z-A)

### Informações no Card
| Campo | Exemplo |
|-------|---------|
| **Nome da Unidade** | ETA Central |
| **Cliente** | Companhia de Saneamento XYZ |
| **Sistema / Subsistema** | Tratamento de Água / Captação |
| **Endereço** | Av. Principal, 1000 - Centro |
| **Status** | 🟢 Ativa / 🔴 Inativa |
| **Ações Rápidas** | Ver detalhes, Nova SS, Ver Ativos |

---

## 4. Detalhe da Unidade

### Abas Disponíveis

| Aba | Conteúdo |
|-----|----------|
| **Visão Geral** | Dados cadastrais, endereço completo, coordenadas GPS, status |
| **Ativos** | Lista de `cfg_units_assets_tags` (tags configuradas na unidade) |
| **SS/OS/Visitas** | Histórico de ordens vinculadas a esta unidade |
| **Contratos** | Contratos ativos que cobrem esta unidade |
| **Disponibilidade** | Dashboard de disponibilidade por setor (Cap. 05) |
| **Endereço/Mapa** | Mapa com localização, distância do usuário |

### Ações Rápidas (Botões)
- **Nova SS** → Inicia wizard no Passo 2 (unidade pré-selecionada)
- **Ver Ativos** → Filtra Cap. 05 por esta unidade
- **Editar** → Gestor/Admin apenas
- **Compartilhar Localização** → Gera link do Google Maps/Waze

---

## 5. Cadastro/Edição de Unidade (Gestor/Admin)

### Campos Obrigatórios
| Campo | Descrição |
|-------|-----------|
| **Cliente** | Seleção de cliente existente (ou cadastro rápido) |
| **Nome da Unidade** | Identificação única (ex: "ETA Central") |
| **Código** | Código curto (ex: "ETA-01") |
| **Endereço Completo** | Rua, número, bairro, cidade, UF, CEP |
| **Coordenadas GPS** | Latitude/Longitude (preenchido auto via endereço ou manual) |
| **Sistema** | Macro-sistema (ex: "Tratamento de Água") |
| **Subsistema** | Detalhamento (ex: "Captação") |
| **Status** | Ativa / Inativa |

### Campos Opcionais
- **Área/Região** (para agrupamento geográfico)
- **Responsável Local** (nome + telefone)
- **Observações** (acesso, restrições, horários)
- **Foto da Fachada** (upload para storage)

### Validações
- Código único por cliente
- Coordenadas válidas (-90 a 90 lat, -180 a 180 lng)
- Cliente deve existir e estar ativo

---

## 6. Clientes (Cadastro Básico)

> **Nota:** Clientes são gerenciados indiretamente via Unidades ou em tela administrativa separada (`/admin/clients` para Super Admin).

### Campos do Cliente
| Campo | Obrigatório | Descrição |
|-------|:-----------:|-----------|
| **Nome Fantasia** | ✅ | Nome comercial |
| **Razão Social** | ✅ | Nome jurídico |
| **CNPJ** | ✅ | Formatado (xx.xxx.xxx/xxxx-xx) |
| **E-mail Contato** | ❌ | Para notificações |
| **Telefone** | ❌ | Com DDD |
| **Endereço Sede** | ❌ | Diferente das unidades |
| **Status** | ✅ | Ativo / Inativo |

### Hierarquia no Banco
- `clients` → `units` (FK `client_id`)
- `units` → `orders` (FK `unit_id` em SS/OS)
- `contracts` → `client_department_id` (vincula contrato ao departamento do cliente)

---

## 7. Busca e Filtros Avançados

### Busca Textual (Campo Único)
Busca simultânea em:
- Nome da unidade
- Endereço
- Nome do cliente
- Código da unidade
- Sistema/Subsistema

### Filtros Combináveis (Sidebar)
| Filtro | Tipo | Exemplos |
|--------|------|----------|
| **Status** | Checkbox múltiplo | Ativa, Inativa, Em Obras |
| **Cliente** | Select único | "Companhia XYZ" |
| **Sistema** | Select único | "Tratamento de Água" |
| **Região/Área** | Select único | "Região Metropolitana" |
| **Possui Ativos** | Boolean | Sim / Não / Qualquer |

### Ordenação
- Nome (A-Z / Z-A) — padrão
- Cliente (A-Z)
- Data de criação (Recente / Antigo)

---

## 8. Geolocalização e Mapa

### Coordenadas
- Preenchimento **automático** via API de geocoding (endereço → lat/lng)
- Edição **manual** permitida (ajuste fino)
- Exibição no mapa (OpenStreetMap/Mapbox) no detalhe

### Distância do Usuário
- Cálculo automático: `unit_reported_distance_m` (metros)
- Exibido no card da lista e no detalhe
- Útil para: "Unidades próximas a mim"

### Navegação Externa
- Botão **"Abrir no Maps"** → Google Maps / Apple Maps / Waze
- Deep link com coordenadas pré-preenchidas

---

## 9. Integrações

| Módulo | Como Usa Unidade/Cliente |
|--------|--------------------------|
| **SS/OS** (Cap. 02/03) | Passo 1: Cliente → Unidade → Setor |
| **Visitas** (Cap. 04) | GPS valida presença na unidade |
| **Ativos** (Cap. 05) | `cfg_units_assets_tags.unit_id` |
| **Almoxarifado** (Cap. 07) | `warehouses.unit_id` (almoxarifado por unidade) |
| **Contratos** (Cap. 10) | `contracts.client_department_id` |
| **Relatórios** (Cap. 09) | Agrupamento por unidade/cliente |

---

## 10. Regras de Negócio Importantes

| Regra | Descrição |
|-------|-----------|
| **Unidade órfã não permitida** | Toda unidade deve ter `client_id` válido |
| **Código único por cliente** | Não pode duplicar código dentro do mesmo cliente |
| **Inativar ≠ Excluir** | `is_available=false` preserva histórico; exclusão só Admin + sem vínculos |
| **GPS validado em visita** | Check-in compara `reported_coordinates` com `unit_latitude/longitude` |
| **Endereço formatado** | CEP preenche rua/bairro/cidade/UF automaticamente (ViaCEP) |

---

## 11. Validações e Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Código já existe para este cliente" | Duplicidade de `code` + `client_id` | Use outro código ou verifique se já não está cadastrado |
| "Cliente inativo" | Tentou criar unidade para cliente `is_available=false` | Ative o cliente primeiro (Admin) |
| "Coordenadas inválidas" | Lat/Lng fora de range ou formato errado | Use busca por endereço ou digite corretamente |
| "Unidade possui OSs ativas" | Tentou inativar unidade com OS aberta | Conclua/cancele OSs primeiro |
| "Endereço não encontrado" | CEP não retorna na ViaCEP | Preencha manualmente ou verifique CEP |

---

## 12. Dicas e Boas Práticas

### Para Cadastro
1. **Padronize nomes** — Ex: "ETA [Nome]", "EE [Bairro]", "RES [Área]"
2. **Use códigos curtos** — Facilita busca e relatórios (ex: "ETA-CEN", "EE-SUL")
3. **Preencha GPS sempre** — Essencial para validação de visita e mapa
4. **Cadastre sistema/sub-sistema** — Ajuda filtros e relatórios setoriais

### Para Busca Diária
1. **Use a busca textual** — Mais rápido que filtros para achar "ETA Central"
2. **Filtro "Possui Ativos=Sim"** — Lista só unidades com equipamentos monitorados
3. **Ordenação por nome** — Padrão alfabético ajuda localização visual

### Para Gestão
1. **Inative unidades desativadas** — Não exclua; preserva histórico
2. **Revise clientes inativos** — Sem unidades ativas = candidato a arquivamento
3. **Exporte lista** — Para planilhas de auditoria/contratos

---

## 13. Perguntas Frequentes (FAQ — Unidades/Clientes)

| Pergunta | Resposta |
|----------|----------|
| **Posso mover unidade para outro cliente?** | Sim (Gestor/Admin): Editar unidade → Trocar `client_id`. Histórico mantido. |
| **Unidade pode ter múltiplos endereços?** | Não. Um endereço principal. Para sub-locais, use Setor/Posição (Cap. 02). |
| **Como cadastrar cliente novo?** | Ao criar unidade → "Novo Cliente" no seletor → Preenche CNPJ/dados → Salva. |
| **O que é "Sistema/Subsistema"?** | Classificação funcional (ex: Sistema="Tratamento Água", Subsistema="Filtração"). Livre, mas padronize. |
| **Posso ver unidades de outros clientes?** | Depende da permissão `units_view_scope`: `own_department` / `own_company` / `all`. |
| **Distância calculada é precisa?** | Haversine (linha reta). Para rota real, use "Abrir no Maps". |

---

## 14. Links Relacionados

- [Cap. 02 — Solicitações de Serviço](./02-solicitacoes-servico.md) — Passo 1: Cliente/Unidade
- [Cap. 03 — Ordens de Serviço](./03-ordens-servico.md) — OS vinculada à unidade
- [Cap. 04 — Visitas Técnicas](./04-visitas-tecnicas.md) — GPS valida unidade
- [Cap. 05 — Ativos e Equipamentos](./05-ativos-equipamentos.md) — Ativos por unidade
- [Cap. 07 — Almoxarifado](./07-almoxarifado.md) — Almoxarifado por unidade
- [Cap. 10 — Configurações](./10-configuracoes.md) — Permissões de escopo de unidade
- [Cap. 11 — Glossário](./11-faq-glossario.md) — Termos: unit_id, client_id, GPS, ViaCEP