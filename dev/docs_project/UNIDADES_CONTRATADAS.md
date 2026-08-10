# Página de Pesquisa de Unidades

## Descrição
Página premium para pesquisar e consultar **todas as unidades de todos os clientes** cadastrados no sistema.

## Localização
`views/Units/UnitsSearch.tsx`

## Arquitetura Correta
A busca é feita **por cliente**, não por contrato, pois:
- ✅ Um cliente pode ter múltiplos contratos
- ✅ As unidades pertencem ao cliente, não ao contrato
- ✅ Evita duplicação de unidades na listagem
- ✅ Mantém a integridade relacional do banco de dados

## Funcionalidades

### 🔍 Busca Inteligente Multi-Campo
Pesquisa em tempo real por:
- Nome da unidade
- Código da unidade
- Nome do cliente
- Endereço completo
- UC (Unidade Consumidora) de energia elétrica
- Sistema / Subsistema / Tipo

### 📊 Informações Exibidas por Unidade
Cada card mostra:
- **Avatar da unidade** (70x70px) com fallback para ícone de prédio
- **Nome completo** com status (Ativo/Inativo)
- **Cliente** associado com ícone business
- **Hierarquia do sistema** (Sistema / Subsistema / Tipo)
- **UC de energia elétrica** em badge amarelo destacado
- **Endereço completo** com ícone de localização
- **Botão de mapa** para abrir localização no Google Maps

### 🎨 Design Premium Dark
- **Gradiente sutil** no header (from-primary/10 via-primary/5)
- **Cards interativos** com hover effects suaves
- **Barra de gradiente** no topo ao hover
- **Ícones coloridos** por categoria:
  - 🔵 Cliente (primary)
  - 🟡 UC Energia (amber-600)
  - 📍 Localização (slate-400)
- **Animações micro** em todos os elementos
- **Chevron animado** que muda de cor

### ⚡ Performance Otimizada
- **Carregamento paginado** (20 unidades por vez)
- **Scroll infinito** com botão "Carregar mais"
- **Contador de itens** restantes
- **Busca instantânea** sem delay
- **Loading state** com spinner animado

## Fluxo de Dados

```typescript
1. Buscar todos os clientes ativos
   ↓
2. Para cada cliente, buscar suas unidades
   ↓
3. Enriquecer cada unidade com o nome do cliente
   ↓
4. Consolidar em um array único
   ↓
5. Aplicar filtros de busca em tempo real
```

## Acesso
**Via Sidebar:** Menu → **Unidades** (ícone de prédio 🏢)

## Componentes Reutilizados
- `SearchInput` - Campo de busca estilizado
- `Avatar` - Imagem da unidade com fallback
- `StatusBadge` - Badge de status ativo/inativo
- `Marker` - Botão para abrir no Google Maps

## Exemplo de Uso
```tsx
<UnitsSearch 
  currentUser={currentUser} 
  onSelectUnit={(unit) => {
    setSelectedUnit(unit);
    setCurrentScreen('unit-details');
  }}
/>
```

## Estados Visuais
- **Loading**: Spinner centralizado com mensagem
- **Vazio**: Ícone de busca com mensagem "Nenhuma unidade cadastrada"
- **Com resultados**: Grid de cards com scroll infinito
- **Busca vazia**: Mensagem "Nenhuma unidade encontrada para esta busca"

## Diferenças da Versão Anterior
| Aspecto | Versão Anterior | Versão Atual |
|---------|----------------|--------------|
| **Busca** | Por contratos | Por clientes |
| **Localização** | `views/ContractUnitsSearch.tsx` | `views/Units/UnitsSearch.tsx` |
| **Screen** | `contract-units-search` | `units-search` |
| **Título** | "Unidades Contratadas" | "Unidades" |
| **Função** | `getUnitsWithContracts()` | `getUnitsByClient()` (existente) |
| **Duplicação** | Possível (múltiplos contratos) | Impossível |

## Vantagens da Abordagem Atual
1. ✅ **Sem duplicação** - Cada unidade aparece uma única vez
2. ✅ **Mais simples** - Usa função existente do dataService
3. ✅ **Mais rápido** - Menos queries ao banco
4. ✅ **Mais correto** - Respeita a relação cliente → unidade
5. ✅ **Escalável** - Funciona com qualquer número de contratos por cliente
