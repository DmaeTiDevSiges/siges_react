# 🧪 Guia de Teste - Otimização de Performance dos Cards de OSs

## ✅ Otimização Implementada

O sistema agora usa **cache inteligente** para evitar consultas repetidas ao banco de dados.

---

## 📝 Como Testar a Otimização

### Passo 1: Abrir DevTools
1. Abra o navegador em `http://localhost:5173`
2. Pressione `F12` para abrir o DevTools
3. Vá na aba **Network**
4. Marque a opção **Disable cache** (para testar sem cache do navegador)

### Passo 2: Teste Inicial (Primeiro Clique)
1. Clique no botão **"Filtrar"** (se houver filtros aplicados)
2. Observe as requisições no Network:
   - Deve haver ~4-6 requests (v_orders, cfg_companies, users, units)
3. **Anote o tempo total** da requisição principal

### Passo 3: Teste de Cache (Cliques Subsequentes)
1. Clique no card **"Execução"** (ou qualquer outro card de situação)
2. Observe as requisições no Network:
   - ✅ **ESPERADO:** Apenas 1-2 requests (v_orders + talvez 1 consulta de dados novos)
   - ❌ **ANTES:** 4-6 requests (todas as consultas repetidas)

3. Clique em outro card, ex: **"Agendadas"**
4. Observe novamente:
   - ✅ **ESPERADO:** Apenas 1 request (v_orders)
   - ❌ **ANTES:** 4-6 requests

5. Clique em mais 2-3 cards diferentes
6. Observe que as consultas diminuem drasticamente

### Passo 4: Validar Performance
Compare os tempos:

**ANTES da otimização:**
- Primeiro clique: ~3-5 segundos
- Cliques seguintes: ~3-5 segundos (sempre lento)

**DEPOIS da otimização:**
- Primeiro clique: ~2-3 segundos (normal)
- Cliques seguintes: ~0.5-1 segundo ⚡ (80% mais rápido)

---

## 🔍 O que Observar no Network

### Requisições que DEVEM aparecer sempre:
- `v_orders` - Busca das OSs filtradas ✅

### Requisições que NÃO devem repetir (cache ativo):
- `cfg_companies` - Empresas (cache de 5 min) ⚡
- `users` com `in=id` - Líderes (cache incremental) ⚡
- `units` com `in=id` - Unidades (cache incremental) ⚡

---

## 📊 Exemplo de Resultado Esperado

### Cenário: Clicar em 5 cards diferentes

```
Clique 1 (Execução):
├─ v_orders?status_id=eq.5          [200ms]
├─ cfg_companies                     [150ms] → CACHEADO ✅
├─ users?id=in.(1,2,3)              [100ms] → CACHEADO ✅
└─ units?id=in.(10,20)              [80ms]  → CACHEADO ✅
TOTAL: ~430ms

Clique 2 (Agendadas):
├─ v_orders?status_id=eq.4          [200ms]
├─ cfg_companies                     [CACHE] ⚡
├─ users?id=in.(4)                  [50ms]  (apenas ID 4 novo)
└─ units?id=in.(30)                 [40ms]  (apenas ID 30 novo)
TOTAL: ~290ms ⚡ (33% mais rápido)

Clique 3 (Autorizadas):
├─ v_orders?status_id=eq.3          [200ms]
├─ cfg_companies                     [CACHE] ⚡
├─ users                             [CACHE] ⚡ (todos já cacheados)
└─ units                             [CACHE] ⚡ (todos já cacheados)
TOTAL: ~200ms ⚡ (53% mais rápido)

Clique 4 e 5: Similar ao clique 3 (~200ms cada)
```

---

## 🐛 Troubleshooting

### Se não ver melhoria de performance:

1. **Verificar se o código está compilado:**
   ```bash
   npm run build
   ```

2. **Limpar cache do navegador:**
   - DevTools → Network → Marcar "Disable cache"
   - Ou pressionar `Ctrl+Shift+R` para hard reload

3. **Verificar console por erros:**
   - DevTools → Console
   - Procurar por erros em vermelho

4. **Forçar limpeza do cache do dataService:**
   - No console do navegador, execute:
   ```javascript
   window.dataService?.clearMetadataCache?.()
   ```

---

## ✅ Critérios de Sucesso

A otimização está funcionando se:

1. ✅ Primeiro clique leva ~2-3 segundos
2. ✅ Cliques seguintes levam ~0.5-1 segundo
3. ✅ Network mostra apenas 1-2 requests após primeiro clique
4. ✅ Não há requisições repetidas de `cfg_companies`
5. ✅ Requisições de `users` e `units` buscam apenas IDs novos

---

## 📞 Suporte

Se encontrar problemas:
1. Tire screenshot do Network tab
2. Copie mensagens de erro do Console
3. Anote os tempos de resposta observados

---

**Última atualização:** 2026-02-15 22:13
