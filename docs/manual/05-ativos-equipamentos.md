# 05 — Ativos e Equipamentos

> **Perfil:** Técnico (consulta, scan, reporte) • Gestor (cadastro, coeficientes, dashboard) • Admin (configuração completa)  
> **Rota:** `/assets` → Lista / Cadastro / Disponibilidade / Calendário  
> **Tabelas-chave:** `assets`, `cfg_assets_tags`, `cfg_assets_tags_subs`, `cfg_units_assets_tags`, `assets_available`, `v_orders_visits_assets`

---

## 1. O que são Ativos no SIGES?

**Ativos** são equipamentos, máquinas, instalações ou componentes físicos que compõem a infraestrutura das unidades dos clientes. Cada ativo pertence a uma **Tag** (categoria principal) e **Sub-Tag** (subcategoria), possui características técnicas e um **coeficiente de participação** para cálculo de disponibilidade do setor.

### Exemplos de Ativos
| Tag (Setor) | Sub-Tag | Ativo Típico |
|-------------|---------|--------------|
| **Bombeamento** | Bomba Centrífuga | BOMBA-01: 150 l/s, 75 CV |
| **Geração Elétrica** | Gerador Diesel | GER-01: 500 kVA |
| **Subestação** | Transformador | TRAFO-SE-01: 13.8/0.44 kV |
| **Comportas** | Comporta Radial | COMP-01: 2×2m |

---

## 2. Hierarquia e Estrutura

```
Cliente (units.client_id)
    └── Unidade (units)
          └── Tag do Ativo (cfg_assets_tags)          ← Ex: "Bombeamento"
                └── Sub-Tag do Ativo (cfg_assets_tags_subs)  ← Ex: "Bomba Centrífuga"
                      └── Configuração por Unidade (cfg_units_assets_tags)
                            ├── Características técnicas (vazão, potência, pressão...)
                            ├── Coeficiente de participação (asset_available_rate)
                            └── Último estado (cache de assets_available)
                                  └── Histórico de Disponibilidade (assets_available)
```

### Tabelas Principais

| Tabela | Propósito |
|--------|-----------|
| `cfg_assets_tags` | Categorias principais (Bombeamento, Geração, Subestação...) |
| `cfg_assets_tags_subs` | Subcategorias (Bomba Centrífuga, Gerador Diesel...) |
| `cfg_units_assets_tags` | **Configuração por unidade** — características + coeficiente + cache |
| `assets_available` | **Histórico** de medições e disponibilidade (append-only) |
| `v_orders_visits_assets` | View: Ativos vinculados a OS/Visitas (para calendário matriz) |

---

## 3. Cadastro de Ativos (Configuração por Unidade)

### Acesso
- `/assets` → Aba "Cadastro" → Botão "+ Novo Ativo"
- Perfil: **Gestor/Admin**

### Passos
1. Selecione **Unidade**
2. Selecione **Tag** (ex: Bombeamento)
3. Selecione **Sub-Tag** (ex: Bomba Centrífuga)
4. Preencha **Características Técnicas** (conforme tag):
   - **Bombeamento:** Vazão (l/s), Potência (CV), Pressão (bar)
   - **Geração:** Potência (kW), Tensão (V), Amperagem (A)
   - **Subestação:** Tensão (kV), Potência (MVA)
   - **Entrada Energia:** Tensão, Amperagem
   - **Comportas:** Pressão
5. Defina **Coeficiente de Participação** (`asset_available_rate`) — *soma por tag ≤ 1.0*
6. Marque **Ativo** (`is_active = true`)
7. Salvar

> ⚠️ **Validação:** A soma dos coeficientes de todos os ativos de uma mesma Tag na unidade não pode exceder 1.0 (100%).

---

## 4. Coeficiente de Participação (asset_available_rate)

### O que é
Peso relativo do ativo na **capacidade operacional total do setor**. Valor entre **0.0 e 1.0**.

### Exemplo: Setor Bombeamento com 3 Bombas
| Ativo | Coeficiente | Disponível? | Contribuição |
|-------|-------------|-------------|--------------|
| Bomba A | 0.40 (40%) | ✅ Sim | 0.40 |
| Bomba B | 0.40 (40%) | ✅ Sim | 0.40 |
| Bomba C | 0.20 (20%) | ❌ Não | 0.00 |
| **Total Setor** | **1.00** | — | **0.80 (80%)** |

### Fórmula
```
Disponibilidade do Setor = Σ (last_is_available × asset_available_rate)
```
- `last_is_available` = 1 (disponível) ou 0 (indisponível)
- Vem do cache em `cfg_units_assets_tags.last_is_available`

### Onde Configurar
- Cadastro/Edição do ativo em `cfg_units_assets_tags.asset_available_rate`
- Interface valida soma ≤ 1.0 por (unidade, tag)

---

## 5. Registro de Disponibilidade (Operação Diária)

### Quem Faz
- **Técnico em campo** durante visita ou ronda
- **Operador** na sala de controle

### Como Registrar
1. Acesse `/assets` → Aba "Disponibilidade" → Botão "Registrar"
2. Ou durante **Visita Técnica** (Cap. 04) → Aba "Ativos" → "Reportar Disponibilidade"
3. Preencha:
   - **Unidade / Tag / Sub-Tag** (se não veio de visita)
   - **Disponível?** (Sim/Não)
   - **Ligado?** (Sim/Não)
   - **Medições atuais** (conforme tag):
     - Vazão, Potência, Pressão, Tensão, Amperagem
   - **Motivo de indisponibilidade** (se aplicável)
   - **Observações**
   - **Foto/Arquivo** (opcional)
   - **GPS** (automático se no app móvel)
4. Enviar → Cria registro em `assets_available` + atualiza cache em `cfg_units_assets_tags`

### Trigger Automático
Ao inserir em `assets_available` com `processing_id = 2` (Reportado), o trigger `tgr_cfg_units_assets_tags_set_last_values_when_processing_2` atualiza **automaticamente** todos os campos `last_*` na configuração do ativo.

---

## 6. Dashboard de Disponibilidade

### Acesso
- `/assets` → Aba "Dashboard" ou `/dashboard` → Card "Disponibilidade Ativos"
- Perfil: **Todos** (visualização), **Gestor/Admin** (filtros avançados)

### Visões
| Visão | Descrição |
|-------|-----------|
| **Geral por Unidade** | % disponibilidade overall + breakdown por setor (tag) |
| **Por Setor (Tag)** | Lista de ativos do setor com status individual + coeficiente |
| **Detalhe do Ativo** | Histórico temporal (gráfico), últimas medições, OSs relacionadas |
| **Alertas** | Ativos com disponibilidade < threshold (ex: < 80%) |

### Indicadores Principais
- **Disponibilidade Overall** = média ponderada dos setores
- **Ativos Críticos** = indisponíveis com coeficiente alto (> 0.2)
- **Tendência** = evolução semanal/mensal

---

## 7. Matriz Anual: Ativos × Meses × Sub-tipo (Calendário)

> **Feature:** `AssetsOrdersVisitsCalendar` — Visão matricial de OSs por ativo/mês

### Acesso
- Dashboard → Aba "Matriz" (ícone `grid_view`)
- Permissão: `dashboard_orders_visits`

### O que Mostra
```
┌──────────────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬─────┤
│   ATIVO      │JAN │FEV │MAR │ABR │MAI │JUN │JUL │AGO │SET │OUT │NOV │DEZ │TOTAL│
├──────────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼─────┤
│ BOMBA-01     │PRV │    │COR │    │PRV │    │    │PRV │    │COR │PRV │    │  5  │
│              │ 1  │    │ 1  │    │ 2  │    │    │ 1  │    │ 1  │ 1  │    │     │
├──────────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼─────┤
│ VÁLV-A       │COR │COR │    │PRV │    │    │    │    │PRV │    │    │PRV │  5  │
└──────────────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴─────┘
```

- **Linhas:** Ativos (`cfg_units_assets_tags` ativos)
- **Colunas:** 12 meses do ano selecionado
- **Células:** Badges por **sub-tipo da OS** (`PRV`, `COR`, `ELE`, `MEC`...)
- **Cores:** Determinísticas por sub-tipo (PRV=âmbar, COR=rosa, ELE=azul, MEC=verde)
- **Filtros:** Contrato, Tipo de OS, Setor (Tag), Equipe
- **Drill-down:** Clique na badge → Modal com lista de OSs/Visitas daquele ativo+mês+sub-tipo

### Fonte de Dados
- View `v_orders_visits_assets` (ativo + visita + OS + sub-tipo + data)
- Agrupamento em memória: (asset, mês, sub-tipo) → contagem

---

## 8. Tags QR / NFC (Identificação Física)

### Funcionalidade
- Cada ativo configurado pode ter **Tag QR Code** e/ou **NFC** física colada no equipamento
- Técnico escaneia no app → Abre diretamente o ativo ou inicia visita com contexto

### Como Usar
1. No cadastro do ativo (`cfg_units_assets_tags`), gere o **QR Code** (botão "Gerar Tag")
2. Imprima etiqueta resistente (QR + código legível)
3. Cole no equipamento
4. No app: Botão "Escanear Tag" (câmera) ou "Ler NFC" (aproximação)
5. Ação: Abre detalhe do ativo / Inicia visita com ativo pré-selecionado

### Dados da Tag
- `asset_tag_id` + `asset_tag_sub_id` + `unit_id` (encoded no QR/NFC)
- Validação: Tag pertence à unidade/empresa do usuário logado

---

## 9. Integração com Visitas e Almoxarifado

| Integração | Como Funciona |
|------------|---------------|
| **Visita Técnica** (Cap. 04) | Aba "Ativos" carrega ativos da OS; técnico marca quais tiveram intervenção |
| **Materiais Consumidos** (Cap. 07) | Aba "Materiais" da visita → baixa automática da custódia do técnico (`users_materials`) |
| **Serviços Executados** | Aba "Serviços" → registra por ativo intervenido |
| **Histórico do Ativo** | Todas as visitas/OSs aparecem no detalhe do ativo (`v_orders_visits_assets`) |

---

## 10. Validações e Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Soma dos coeficientes excede 100%" | `asset_available_rate` total > 1.0 na tag | Reduza coeficientes ou desative ativos |
| "Tag não encontrada para esta unidade" | QR/NFC lido não pertence à unidade | Verifique se tag está no local correto |
| "Ativo já possui registro hoje" | Tentativa de duplicar registro diário | Edite o registro existente (último do dia) |
| "Medição fora dos limites" | Valor < min ou > max configurado | Confira equipamento; se correto, ajuste min/max no cadastro |
| "Não é possível excluir ativo com histórico" | `assets_available` tem registros | Use "Desativar" (`is_active=false`) em vez de excluir |

---

## 11. Regras de Negócio Importantes

| Regra | Descrição |
|-------|-----------|
| **Coeficiente ≤ 1.0 por tag/unidade** | Validação no frontend + constraint no banco |
| **Cache automático** | Trigger atualiza `cfg_units_assets_tags.last_*` a cada registro reportado |
| **Soft delete** | `is_deleted=true` + `deleted_at` + `deleted_user_id` — histórico preservado |
| **Medições por tag** | Campos visíveis/exigidos dependem da Tag (config em `cfg_assets_tags`) |
| **GPS opcional mas recomendado** | Valida proximidade à unidade (`unit_reported_distance_m`) |
| **Integração OS** | `assets_available.o_id` + `o_mask` vincula registro à OS/Visita que o gerou |

---

## 12. Dicas e Boas Práticas

### Para Gestores (Cadastro)
1. **Defina coeficientes reais** — Baseie-se em capacidade nominal, não em "achismo"
2. **Padronize unidades** — l/s, CV, bar, kV, A (use as sugestões do sistema)
3. **Ative apenas o necessário** — `is_active=false` para ativos descomissionados
4. **Revise trimestralmente** — Coeficientes mudam com expansões/remoções

### Para Técnicos (Campo)
1. **Registre sempre** — Mesmo se "tudo normal" (confirma disponibilidade)
2. **Use o app móvel** — GPS + câmera + offline automático
3. **Fotografe painéis/medidores** — Evita digitação errada
4. **Reporte indisponibilidade IMEDIATAMENTE** — Aciona alertas automáticos

### Para Análise (Dashboard)
1. **Filtre por contrato/cliente** — Visão contratual
2. **Use o calendário matriz** — Planeje preventivas (PRV) vs corretivas (COR)
3. **Exporte para Excel** — Relatórios gerenciais mensais

---

## 13. Perguntas Frequentes (FAQ — Ativos)

| Pergunta | Resposta |
|----------|----------|
| **Posso mudar a Tag de um ativo?** | Não diretamente. Desative o atual (`is_active=false`) e crie novo com a Tag correta. |
| **O que acontece se somar coeficientes > 1.0?** | Sistema bloqueia o salvamento. Ajuste para total ≤ 1.0. |
| **Disponibilidade é calculada em tempo real?** | Sim, lendo `cfg_units_assets_tags.last_is_available` (cache atualizado por trigger). |
| **Posso registrar disponibilidade offline?** | Sim. App móvel guarda local e sincroniza ao voltar online. |
| **Como ver todo histórico de um ativo?** | Detalhe do ativo → Aba "Histórico" (lista `assets_available` ordenada por data). |
| **QR Code e NFC são a mesma coisa?** | Não. QR = código visual (câmera). NFC = chip de aproximação. Podem coexistir no mesmo ativo. |
| **Sub-tipo da OS (PRV/COR) vem de onde?** | `cfg_order_type_subs.code` — configurado no cadastro de tipos de OS. |

---

## 14. Links Relacionados

- [Cap. 03 — Ordens de Serviço](./03-ordens-servico.md) — OSs vinculadas a ativos
- [Cap. 04 — Visitas Técnicas](./04-visitas-tecnicas.md) — Reporte de disponibilidade em visita
- [Cap. 07 — Almoxarifado](./07-almoxarifado.md) — Materiais usados nos ativos
- [Cap. 09 — Dashboard e Relatórios](./09-dashboard-relatorios.md) — Exportação de dados de ativos
- [Cap. 11 — Glossário](./11-faq-glossario.md) — Termos: asset_tag, asset_available_rate, processing_id