# Safe Area Implementation - Mobile Devices

## Objetivo
Ajustar TODAS as páginas e componentes para respeitar a safe area de dispositivos móveis (notch, status bar, home indicator).

## Status: 🟡 Em Progresso

## Contexto
O projeto já possui classes CSS utilitárias para safe area definidas em `index.css`:
- `.safe-area-top` - padding-top para notch/status bar
- `.safe-area-bottom` - padding-bottom para home indicator
- `.safe-area-left` - padding-left para bordas laterais
- `.safe-area-right` - padding-right para bordas laterais

Alguns componentes já implementam safe area parcialmente:
- ✅ `Layout.tsx` - Header com safe-area-top
- ✅ `BottomNav.tsx` - Navegação inferior com safe-area-inset-bottom inline
- ✅ `OrderVisitBottomNav.tsx` - Navegação de visita com safe-area-inset-bottom inline
- ✅ `Sidebar.tsx` - Sidebar com safe-area-top e safe-area-bottom
- ✅ `LoginScreen.tsx` - Tela de login com safe-area-top e safe-area-bottom

## Componentes a Ajustar

### 1. Componentes Globais (Prioridade ALTA)
- [x] `Layout.tsx` - ✅ JÁ IMPLEMENTADO
- [x] `Header.tsx` - ✅ Aplicado via Layout
- [x] `BottomNav.tsx` - ✅ JÁ IMPLEMENTADO
- [x] `Sidebar.tsx` - ✅ JÁ IMPLEMENTADO
- [ ] `components/ui/PageHeader.tsx` - Verificar se precisa
- [ ] Modais globais - Verificar todos os modais

### 2. Telas de Dashboard (Prioridade ALTA)
- [ ] `views/Dashboards/DashboardOrdersUserScreen.tsx`
- [ ] `views/Dashboards/DashboardOrdersAdminScreen.tsx`

### 3. Telas de Order Visit (Prioridade ALTA)
- [ ] `views/OrderVisit/OrderVisitScreen.tsx`
- [ ] `views/OrderVisit/OrderVisitAsset/OrderVisitAssetsList.tsx`
- [ ] `views/OrderVisit/OrderVisitAsset/OrderVisitAssetActivities.tsx`
- [ ] `views/OrderVisit/OrderVisitAsset/OrderVisitAssetMaterials.tsx`
- [ ] `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx`
- [ ] `views/OrderVisit/OrderVisitService/OrderVisitServicesList.tsx`
- [ ] `views/OrderVisit/OrderVisitVehicle/OrderVisitVehiclesList.tsx`
- [ ] `views/OrderVisit/OrderVisitFinancialDetail.tsx`

### 4. Telas de Order Request (Prioridade ALTA)
- [ ] `views/OrderRequest/OrderRequestScreen.tsx`
- [ ] `views/OrderRequest/OrderRequestForm.tsx`
- [ ] `views/OrderRequest/OrderRequestView.tsx`
- [ ] `views/OrderRequest/OrdersRequestsDashboardAdmin.tsx`

### 5. Telas de Service Request (Prioridade ALTA)
- [ ] `views/ServiceRequest/ServiceRequestScreen.tsx`
- [ ] `views/ServiceRequest/ServiceRequestForm.tsx`
- [ ] `views/ServiceRequest/ServiceRequestDetail.tsx`

### 6. Telas de Assets (Prioridade MÉDIA)
- [ ] `views/Assets/AssetView.tsx`
- [ ] `views/Assets/AssetForm.tsx`
- [ ] `views/Assets/AssetsSearch.tsx`

### 7. Telas de Settings (Prioridade MÉDIA)
- [ ] `views/Settings/AppSettings.tsx`
- [ ] Todas as sub-telas de Settings (50+ arquivos)

### 8. Telas de Admin (Prioridade MÉDIA)
- [ ] `views/Admin/ProfilePermissionsScreen.tsx`

### 9. Telas de Usuário (Prioridade BAIXA)
- [x] `views/Users/LoginScreen.tsx` - ✅ JÁ IMPLEMENTADO
- [ ] `views/Users/ProfileScreen.tsx`
- [ ] `views/Users/UsersTracker.tsx`

### 10. Outras Telas (Prioridade BAIXA)
- [ ] `views/Notifications/NotificationsList.tsx`
- [ ] `views/Contracts/*` - Todas as telas de contratos
- [ ] `views/Departments/*` - Todas as telas de departamentos

## Estratégia de Implementação

### Abordagem 1: Container Wrapper (Recomendado)
Criar um componente wrapper que aplica safe area automaticamente:

```tsx
// components/SafeAreaContainer.tsx
interface SafeAreaContainerProps {
  children: React.ReactNode;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  className?: string;
}

export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  top = true,
  bottom = true,
  left = false,
  right = false,
  className = ''
}) => {
  const classes = [
    top && 'safe-area-top',
    bottom && 'safe-area-bottom',
    left && 'safe-area-left',
    right && 'safe-area-right',
    className
  ].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
};
```

### Abordagem 2: Aplicação Direta
Adicionar classes CSS diretamente nos containers principais de cada tela:

```tsx
// Exemplo: DashboardOrdersUserScreen.tsx
<div className="flex flex-col h-full safe-area-top safe-area-bottom">
  {/* conteúdo */}
</div>
```

### Abordagem 3: Via Layout (Já Implementado Parcialmente)
O componente `Layout.tsx` já aplica `safe-area-top` no header. Para telas que usam Layout, apenas garantir que o conteúdo principal respeite o bottom.

## Regras de Aplicação

### Quando aplicar safe-area-top:
- ✅ Telas full-screen sem header
- ✅ Headers fixos no topo
- ✅ Modais que ocupam toda a tela
- ❌ Conteúdo dentro de Layout (já aplicado)

### Quando aplicar safe-area-bottom:
- ✅ Navegação inferior fixa (BottomNav)
- ✅ Botões de ação fixos no rodapé
- ✅ Listas scrolláveis (padding-bottom)
- ✅ Modais com ações no rodapé

### Quando aplicar safe-area-left/right:
- ✅ Conteúdo em landscape mode
- ✅ Telas com scroll horizontal
- ⚠️ Raramente necessário em apps portrait

## Verificação

### Checklist de Teste
- [ ] Testar em iPhone com notch (iPhone X+)
- [ ] Testar em iPhone sem notch (iPhone 8-)
- [ ] Testar em Android com gesture navigation
- [ ] Testar em Android com botões físicos
- [ ] Testar rotação de tela (landscape)
- [ ] Verificar modais e overlays
- [ ] Verificar navegação entre telas

### Ferramentas de Teste
- Chrome DevTools - Device Emulation
- Safari - Responsive Design Mode
- Capacitor Live Reload em dispositivo real
- Android Studio Emulator
- Xcode Simulator

## Notas Técnicas

### CSS Safe Area Insets
```css
/* Já implementado em index.css */
.safe-area-top {
    padding-top: constant(safe-area-inset-top); /* iOS 11.0 */
    padding-top: env(safe-area-inset-top);      /* iOS 11.2+ */
}
```

### Viewport Meta Tag
Verificar se está configurado corretamente em `index.html`:
```html
<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0">
```

### Capacitor Configuration
Verificar `capacitor.config.ts` para configurações específicas de safe area.

## Próximos Passos

1. ✅ Criar este documento de planejamento
2. [ ] Criar componente SafeAreaContainer (opcional)
3. [ ] Ajustar telas de prioridade ALTA
4. [ ] Ajustar telas de prioridade MÉDIA
5. [ ] Ajustar telas de prioridade BAIXA
6. [ ] Testar em dispositivos reais
7. [ ] Documentar padrões no guia de desenvolvimento

## Referências
- [Apple Human Interface Guidelines - Safe Area](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Android - Display Cutout](https://developer.android.com/guide/topics/display-cutout)
- [CSS env() - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
