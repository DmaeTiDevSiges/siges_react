# 📘 SIGES — Manual de Operação

**Sistema Integrado de Gestão de Serviços**

---

## 📋 Sumário

| Capítulo | Título | Descrição |
|----------|--------|-----------|
| **01** | [Introdução ao SIGES](./01-introducao.md) | Visão geral, conceitos-chave e navegação principal |
| **02** | [Solicitações de Serviço (SS)](./02-solicitacoes-servico.md) | Criação, edição, clonagem, evidências e duplicatas |
| **03** | [Ordens de Serviço (OS)](./03-ordens-servico.md) | Geração a partir de SS, tipos, prioridades, máscaras |
| **04** | [Visitas Técnicas](./04-visitas-tecnicas.md) | Check-in/out, relatórios, aprovação técnica e financeira |
| **05** | [Ativos e Equipamentos](./05-ativos-equipamentos.md) | Cadastro, tags QR/NFC, manutenção, disponibilidade |
| **06** | [Unidades e Clientes](./06-unidades-clientes.md) | Cadastro, hierarquia, busca, endereços e GPS |
| **07** | [Almoxarifado e Estoque](./07-almoxarifado.md) | Solicitações, autorização, separação, custódia, CMP |
| **08** | [Equipes e Colaboradores](./08-equipes-colaboradores.md) | Departamentos, equipes, disponibilidade, notificações |
| **09** | [Dashboard e Relatórios](./09-dashboard-relatorios.md) | KPIs, métricas, exportação de dados |
| **10** | [Configurações do Sistema](./10-configuracoes.md) | Perfil, notificações, ajustes, permissões |
| **11** | [FAQ e Glossário](./11-faq-glossario.md) | Perguntas frequentes e termos técnicos |

---

## 🎯 Como Usar Este Manual

### Navegação Rápida
- Use o **sumário lateral** (no GitHub/GitLab) ou **Ctrl+F** para buscar termos
- Cada capítulo é independente — leia apenas o que precisa
- Links internos conectam tópicos relacionados entre capítulos

### Convenções de Texto
| Símbolo | Significado |
|---------|-------------|
| ✅ | Ação concluída com sucesso |
| ⚠️ | Atenção / Cuidado necessário |
| ❌ | Erro / Não permitido |
| 💡 | Dica / Boa prática |
| 🔧 | Apenas para administradores |
| `código` | Campo, botão ou valor exato da interface |

### Ícones de Perfil
- 👷 **Técnico/Colaborador** — Executa visitas, reporta, usa almoxarifado
- 👨‍💼 **Gestor/Líder** — Autoriza, aprova, gerencia equipe
- 🛡️ **Admin/Super Admin** — Configura sistema, gerencia usuários, acessa tudo

---

## 📱 Acesso Rápido às Principais Telas

| Módulo | Rota no App | Perfil Mínimo |
|--------|-------------|---------------|
| Dashboard | `/dashboard` | Todos |
| Solicitações de Serviço | `/service-request` | Técnico |
| Ordens de Serviço | `/orders` | Técnico |
| Visitas Técnicas | `/visits` | Técnico |
| Ativos/Equipamentos | `/assets` | Técnico |
| Unidades | `/units` | Todos |
| Almoxarifado | `/warehouse` | Almoxarife |
| Equipes | `/teams` | Gestor |
| Configurações | `/settings` | Admin |

---

## 🔄 Fluxo Principal (Visão Geral)

```mermaid
flowchart LR
    A[📝 Solicitação<br/>de Serviço<br/>(SS)] --> B[🔧 Ordem de<br/>Serviço<br/>(OS)]
    B --> C[📅 Visita<br/>Técnica]
    C --> D[✅ Relatório<br/>da Visita]
    D --> E[🔬 Aprovação<br/>Técnica]
    E --> F[💰 Aprovação<br/>Financeira]
    F --> G[📦 Arquivo<br/>Final]
    
    H[📦 Almoxarifado] -.-> C
    I[🏷️ Ativos] -.-> C
    J[👥 Equipes] -.-> C
    
    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#fce4ec
    style D fill:#e8f5e9
    style E fill:#f3e5f5
    style F fill:#fff8e1
    style G fill:#e0f2f1
```

---

## 📞 Suporte e Atualizações

| Canal | Descrição |
|-------|-----------|
| **Dúvidas operacionais** | Consulte o capítulo correspondente ou FAQ (Cap. 11) |
| **Bugs/Erros do sistema** | Reporte via canal de suporte técnico interno |
| **Sugestões de melhoria** | Abra issue no repositório do projeto |
| **Treinamento** | Solicite ao gestor da área |

> **Versão do Manual:** 1.0.0  
> **Última Atualização:** Setembro 2026  
> **Compatibilidade:** SIGES v2.x+

---

## 📄 Exportar PDF

Este manual está disponível em Markdown no repositório. Para gerar PDF:

```bash
# Local (requer pandoc + texlive)
npm run manual:build

# Ou via GitHub Actions (artefato em Actions → Build Manual PDF)
```

---

*Documentação mantida pela equipe SIGES. Fonte da verdade: repositório Git.*