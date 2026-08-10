# Guia de Uso - Keyboard Aware Scroll View

## Problema Resolvido
Quando o teclado virtual aparece em dispositivos mobile (APK e web), os campos de input/dropdown ficavam sobrepostos pelo teclado, impossibilitando a visualização e edição.

## Solução Implementada

### 1. Hook `useKeyboard` Melhorado (`hooks/useKeyboard.ts`)
- Detecta quando o teclado está visível
- Faz scroll automático para inputs na parte inferior da tela
- Usa `block: 'end'` para posicionar o input no final da viewport visível
- Delay otimizado de 350ms para aguardar animação do teclado

### 2. Hook `useKeyboardHeight` (`hooks/useKeyboard.ts`)
- Retorna a altura do teclado em pixels
- Útil para adicionar padding dinâmico

### 3. Componente `KeyboardAwareScrollView` (`components/ui/KeyboardAwareScrollView.tsx`)
- Container scrollável que se ajusta automaticamente ao teclado
- Adiciona padding bottom dinâmico baseado na altura do teclado
- Faz scroll automático para o input focado

## Como Usar

### Opção 1: Substituir container simples por KeyboardAwareScrollView

**Antes:**
```tsx
<div className="flex-1 p-4 overflow-y-auto">
  <form>
    <input name="field1" />
    <input name="field2" />
    <input name="field3" />
  </form>
</div>
```

**Depois:**
```tsx
import { KeyboardAwareScrollView } from '../../components/ui/KeyboardAwareScrollView';

<KeyboardAwareScrollView className="flex-1 p-4" extraPadding={30}>
  <form>
    <input name="field1" />
    <input name="field2" />
    <input name="field3" />
  </form>
</KeyboardAwareScrollView>
```

### Opção 2: Usar hooks diretamente

```tsx
import { useKeyboard, useKeyboardHeight } from '../../hooks/useKeyboard';

const MyComponent = () => {
  const isKeyboardVisible = useKeyboard();
  const keyboardHeight = useKeyboardHeight();
  
  return (
    <div 
      className="flex-1 overflow-y-auto"
      style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 0 }}
    >
      {/* conteúdo com inputs */}
    </div>
  );
};
```

## Configurações Aplicadas

### 1. Viewport (`index.html`)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">
```
- `interactive-widget=resizes-content`: Faz o viewport redimensionar quando o teclado aparece (Chrome 121+)

### 2. CSS Global (`index.html`)
```css
input, textarea, select {
  font-size: 16px !important; /* Previne zoom automático no iOS */
}

body {
  overscroll-behavior: none; /* Previne bounce no iOS */
}
```

### 3. Capacitor Config (`capacitor.config.ts`)
```typescript
Keyboard: {
  resize: 'body', // Já configurado
}
```

## Telas Já Corrigidas
- ✅ `OrderVisitScreen` - Tela de detalhes da visita

## Próximos Passos
Aplicar `KeyboardAwareScrollView` em outros formulários do sistema:
- `UserForm.tsx`
- `TeamForm.tsx`
- `MaintenancePlanForm.tsx`
- `UnitAssetTagAvailableForm.tsx`
- Demais formulários com inputs

## Testes
Testar em:
- [ ] Android (APK) - teclado nativo
- [ ] iOS (APK) - teclado nativo
- [ ] Chrome mobile (web) - teclado virtual
- [ ] Safari mobile (web) - teclado virtual
- [ ] Rotação de tela com teclado aberto
- [ ] Múltiplos inputs sequenciais
