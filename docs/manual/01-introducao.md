# 01 — Introdução ao SIGES

## 1. O que é o SIGES?

O **SIGES** (Sistema Integrado de Gestão de Serviços) é uma plataforma completa para gestão de operações de campo, manutenção e serviços técnicos. Ele conecta **Contratantes** (quem solicita) e **Contratadas** (quem executa) em um fluxo digital único, do chamado ao arquivo final.

### Principais Capacidades

| Área | O que faz |
|------|-----------|
| **Solicitações (SS)** | Registro inicial de necessidades/problemas |
| **Ordens (OS)** | Planejamento e autorização dos serviços |
| **Visitas** | Execução em campo com check-in/out, fotos, relatórios |
| **Ativos** | Cadastro de equipamentos, tags QR/NFC, histórico |
| **Almoxarifado** | Controle de estoque, requisições, custódia técnica |
| **Equipes** | Gestão de departamentos, equipes, disponibilidade |
| **Relatórios** | KPIs, dashboards, exportação de dados |

---

## 2. Conceitos-Chave

### Hierarquia de Documentos

```
Solicitação de Serviço (SS)     ← "Mãe" — registro inicial
    │
    └─▶ Ordem de Serviço (OS)    ← "Filha" — planejamento/execução
           │
           └─▶ Visita Técnica    ← Execução real em campo
                  │
                  └─▶ Relatório + Aprovações (Técnica → Financeira)
```

### Máscaras de Identificação

| Documento | Formato | Exemplo |
|-----------|---------|---------|
| **SS** | `{contador}.0.{ano}` | `42.0.2026` |
| **OS** | `{SS.contador}.{filho}.{ano}` | `42.1.2026` |
| **Visita** | `{OS.mask}.{seq:2d}` | `42.1.2026.01` |

> **Regra:** Uma SS pode gerar múltiplas OS. Uma OS pode ter múltiplas Visitas.

### Perfis de Usuário

| Perfil | Papel | Acesso Principal |
|--------|-------|------------------|
| **Técnico/Colaborador** | Executa visitas, reporta, retira materiais | Visitas, Almoxarifado, Ativos |
| **Líder de Equipe** | Gerencia equipe, aprova relatórios técnicos | + Aprovação técnica, Encaminhamento OS |
| **Gestor/Supervisor** | Autoriza OS, aprova financeiro, relatórios | + Autorização OS, Aprovação financeira, Equipes |
| **Almoxarife** | Controla estoque, separa/entrega materiais | Almoxarifado (telas de triagem) |
| **Admin/Super Admin** | Configura sistema, usuários, permissões | Todas + Configurações, Ajustes |

---

## 3. Navegação Principal

### Barra Inferior (Bottom Navigation) — Sempre Visível

| Ícone | Rótulo | Rota | Descrição |
|-------|--------|------|-----------|
| 🏠 | **Painel** | `/dashboard` | Visão geral, KPIs, ações rápidas |
| 🏢 | **Unidades** | `/units` | Lista, busca, detalhes de clientes/unidades |
| 📋 | **Contratos** | `/contracts` | Contratos ativos, vigências |
| 👤 | **Perfil** | `/profile` | Dados do usuário, disponibilidade, foto |
| ⚙️ | **Ajustes** | `/settings` | *Apenas Super Admin* — Configurações globais |

### Navegação Contextual (Dentro dos Módulos)

- **Header superior**: Título da tela + Botão "Voltar" (apenas em sub-telas) + Avatar com indicador de disponibilidade
- **Abas internas**: Organizam sub-seções (ex: em Visita → Ativos / Serviços / Materiais / Veículos / Financeiro / Histórico)

---

## 4. Indicadores Visuais de Status

### Disponibilidade do Usuário (Bolinha no Avatar)

| Cor | Significado | Condição |
|-----|-------------|----------|
| 🟢 **Verde** | Em Atividade | `isAvailable = true` E `ovIdInProgress > 0` |
| 🟡 **Amarelo** | Disponível | `isAvailable = true` E `ovIdInProgress = 0` |
| ⚫ **Cinza** | Indisponível | `isAvailable = false` E `ovIdInProgress = 0` |

### Status Badge (Componente Comum)

| Badge | Cor | Quando aparece |
|-------|-----|----------------|
| **Ativo** | Verde | Em execução / Aberta / Em andamento |
| **Pendente** | Amarelo | Aguardando ação / Autorização |
| **Concluído** | Azul | Finalizado com sucesso |
| **Cancelado/Erro** | Vermelho | Cancelado / Rejeitado / Falha |

---

## 5. Fuso Horário e Dados

- **Todas as datas/horas** são armazenadas e exibidas no fuso **America/Sao_Paulo** (Brasília)
- Formato ISO 8601 com offset: `2026-09-07T14:30:00-03:00`
- O app converte automaticamente para o fuso local do dispositivo

---

## 6. Modo Offline (Capacitor)

O SIGES roda como **PWA / App nativo (Capacitor)**:
- ✅ Funciona offline para leitura de dados já sincronizados
- ✅ Criação de SS/OS/Visitas em fila local (sincroniza ao voltar online)
- ✅ Fotos ficam em cache local até upload
- ⚠️ Busca de unidades/clientes requer conexão (dados dinâmicos)

---

## 7. Acesso ao Sistema

### Login
1. Abra o app (navegador ou instalado)
2. Informe **e-mail** e **senha**
3. Se MFA ativo: insira código do autenticador
4. Selecione **empresa/departamento** (se tiver acesso a múltiplos)

### Troca de Empresa/Departamento
- Perfil → **Trocar Contexto** → Selecione nova empresa/departamento
- Recarrega dashboards e listas automaticamente

---

## 8. Atalhos Úteis

| Ação | Como Fazer |
|------|------------|
| Criar SS rápida | Dashboard → Botão flutuante "+" → "Nova SS" |
| Ver minhas visitas | Dashboard → Card "Minhas Visitas" |
| Aprovações pendentes | Dashboard → Card "Para Aprovar" |
| Almoxarifado (minhas requisições) | Bottom Nav → Unidades → Aba "Almoxarifado" |
| Scan QR/NFC de ativo | Visita → Botão "Escanear Tag" |
| Atualizar dados (pull-to-refresh) | Puxe a lista para baixo |

---

## 9. Onde Encontrar Ajuda

| Dúvida | Onde Procurar |
|--------|---------------|
| "Como faço X?" | Capítulo correspondente deste manual |
| "Erro ao salvar" | Seção **Validações e Erros** do capítulo |
| "O que significa este status?" | Capítulo 11 — Glossário |
| "Não tenho permissão" | Fale com seu gestor → Cap. 10 (Configurações/Permissões) |
| "Bug no app" | Reporte no canal de suporte técnico |

---

## 10. Próximos Passos

- **Usuário novo** → Leia Cap. 02 (Solicitações de Serviço) para entender o fluxo base
- **Técnico de campo** → Foque em Cap. 04 (Visitas Técnicas) e Cap. 07 (Almoxarifado)
- **Gestor** → Cap. 03 (OS), Cap. 04 (Aprovações), Cap. 08 (Equipes)
- **Admin** → Cap. 10 (Configurações) + documentação técnica no repositório

---

> 💡 **Dica:** Mantenha este manual acessível (favorito no navegador ou PDF no celular). A busca (Ctrl+F) resolve 90% das dúvidas rápidas.