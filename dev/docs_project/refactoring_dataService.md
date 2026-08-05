# Refatoração do `dataService.ts`

Este documento serve como diretriz arquitetural para a refatoração do arquivo central `dataService.ts`, que devido ao seu tamanho (mais de 13.000 linhas), começou a causar gargalos de performance na IDE, potenciais conflitos de merge e lentidão de compilação.

## Estratégia de Refatoração (Padrão Facade + Strangler Fig)

A abordagem escolhida visa **não quebrar a aplicação**. O `dataService.ts` continuará existindo como uma "Fachada" (Facade) que exporta métodos, mas sua implementação interna será progressivamente movida para serviços menores focados por Domínio.

### Exemplo de Transição

```typescript
// 1. O novo serviço é criado no seu respectivo domínio
import { materialsService } from './materials/materialsService';

// 2. O dataService continua exportando a mesma assinatura para não quebrar a UI
export const dataService = {
  // Funções migradas
  getMaterials: materialsService.getMaterials,
  
  // Funções legadas ainda não migradas
  getOrders: async () => { /* implementação gigante antiga */ } 
};
```

## Módulos Identificados para Migração

Abaixo estão os 7 grandes módulos mapeados dentro do arquivo original que devem ser extraídos gradualmente.

### Módulo 1: `Materials` (Materiais, Compras e Almoxarifado)
- `services/materials/materialsService.ts`: CRUD de materiais, cache de busca.
- `services/materials/purchasesService.ts`: Solicitações de compra, autorização e conclusão.
- `services/materials/warehouseService.ts`: Controle de estoques e armazéns.

### Módulo 2: `Orders` (Ordens de Serviço e Visitas)
- `services/orders/ordersService.ts`: Listagem e criação de OS.
- `services/orders/visitsService.ts`: Gestão de visitas técnicas, execuções e chat interno da visita.

### Módulo 3: `Assets` (Ativos e Inventário)
- `services/assets/assetsService.ts`: Gestão de ativos e equipamentos.
- `services/assets/assetTagsService.ts`: Vinculação e leitura de TAGs/QR Codes.

### Módulo 4: `Companies` (Empresas e Unidades)
- `services/companies/companiesService.ts`: Entidades empregadoras e contratos.
- `services/companies/unitsService.ts`: Unidades (lojas/filiais) atendidas.

### Módulo 5: `Auth & Users` (Autenticação e Perfis)
- `services/auth/authService.ts`: Gerenciamento de sessão com Supabase.
- `services/auth/usersService.ts`: CRUD de usuários, gestão de permissões e perfis de acesso.

### Módulo 6: `Tools` (Ferramentas)
- `services/tools/toolsService.ts`: Gestão de inventário de ferramentas de técnicos.

### Módulo 7: `Settings & Notifications` (Configurações Globais)
- `services/core/notificationsService.ts`: Central de notificações push/in-app do sistema.
- `services/core/settingsService.ts`: Parametrizações, feriados e variáveis globais.

## Estado da Execução (03/07/2026)

- [x] **Materials:** `materialsService`, `purchasesService` e `warehouseService` extraídos e ligados à fachada.
- [x] **Orders:** `ordersService`, `visitsService` e `visitChatService` extraídos e ligados à fachada.
- [x] **Assets:** CRUD, TAGs, atributos e configurações extraídos para `services/assets`.
- [x] **Companies:** empresas e contratos extraídos; unidades permanecem em `services/core/unitsService.ts` por serem compartilhadas entre vários domínios.
- [x] **Auth & Users:** autenticação, sessão, usuários, equipes e permissões estão consolidados em `services/users/usersService.ts`. A separação física adicional de `authService.ts` foi evitada para não duplicar o mapeamento do usuário autenticado.
- [x] **Tools:** implementação mantida em `services/toolsService.ts` para preservar os imports existentes.
- [x] **Settings & Notifications:** serviços extraídos em `services/core`, junto dos serviços transversais de dashboard, planos de manutenção e configuração de ordens.

### Resultado

- `dataService.ts` passou de 13.878 para 2.167 linhas físicas (redução aproximada de 84%).
- 322 métodos foram migrados nesta execução; a fachada possui 335 delegações geradas por `apply`, além de delegações explícitas já existentes.
- O código legado morto (unreachable) remanescente sob as delegações foi completamente removido.
- Imports circulares dos serviços extraídos para `dataService.ts` foram removidos.
- O script `scripts/finish-data-service-refactor.mjs` faz a delegação por AST, preservando assinaturas e evitando substituições frágeis por número de linha.

### Métodos mantidos localmente na fachada

Os métodos abaixo são utilitários transversais, adaptadores de imagem/upload ou inscrições em tempo real e, por isso, ainda não pertencem integralmente a um único domínio:

- `clearMetadataCache`
- `getPublicImageUrl`
- `getSignatureUrl`
- `saveOrderVisitSignature`
- `getAssetTagsByUnit`
- `subscribeToOrdersVisits`
- `uploadUnitImage`
- `subscribeToNotifications`
- `getUnitsStatuses`
- `subscribeToUsers`

### Validação

- [x] `npm run lint` (`tsc --noEmit`)
- [x] `npm run build` (Vite, 2.562 módulos transformados)
- [ ] `npm test -- --runInBand`: bloqueado porque o preset `ts-jest` não está disponível no `node_modules` local.

## Princípios de Migração
1. **Sem Estado Local (No Local State):** O novo serviço não deve guardar instâncias de variáveis de cache mutáveis globais se possível. Use hooks ou bibliotecas state-management (como TanStack Query).
2. **Separação de Preocupações:** Lógicas complexas de UI (como disparar Notificações App/Web simultaneamente com uma mudança no banco) devem idealmente ficar na camada de negócio, não empacotadas forçadamente no Data Access Object (DAO).
