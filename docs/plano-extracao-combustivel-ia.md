# Extração de Dados do Comprovante de Abastecimento (Gemini Vision) — Plano & Registro

> **Data**: 2026-10-15 · **Status geral**: 🟢 Implementado
>
> Funcionalidade do lançamento de **abastecimento de combustível** (screen
> `fuel-expense`): ao anexar a foto do comprovante, a IA lê a imagem e
> pré-preenche o formulário. O layout do cupom **varia por estabelecimento**,
> a extração é tolerante a posição/diagramação dos campos.

---

## 1. Objetivo

Reduzir a digitação no lançamento individual de abastecimento lendo o cupom
fiscal/cartão de frota com **Gemini Vision**. O usuário:

1. seleciona/cria o veículo,
2. anexa (ou tira) a foto do comprovante,
3. a IA preenche automaticamente **Placa, Data, Odômetro (se houver), Qtd.
   Combustível e Valor Total**,
4. confere/edita e salva.

**Nunca bloqueia o lançamento**: se a leitura falhar ou for incerta, o usuário
preenche manualmente (fluxo atual).

---

## 2. Escopo e decisões

| Decisão | Escolha |
|---|---|
| Gatilho | **Automático** ao confirmar a foto no `ImageEditorModal` |
| Campos extraídos | `plate`, `date`, `odometer?`, `fuelQuantity`, `totalValue` (+ `station` informativo) |
| Layout | Tolerante: campos localizados por **semântica/rótulo**, nunca por posição (prompt) |
| Falha de leitura | `toast.warning` + preenchimento manual; sem retry obrigatório |
| Sobrescrita | Só preenche campo **vazio ou previamente auto-preenchido** (nunca digitado à mão) |
| Data — manual | `createdAt` = **data/hora do momento da inclusão**; competência = mês corrente |
| Data — extraída | `createdAt` = **data que consta no documento**; competência = mês do documento |
| Campo Data | Só aparece na UI quando extraído da imagem (editável; apagar → volta ao modo manual) |
| Placa | Preenche o próprio campo "Veículo (Placa)"; match único exato seleciona o veículo |
| Odômetro | Só preenche se constar no cupom (cards de frota) — senão continua manual |
| Infra | Gemini client-side (`VITE_GEMINI_API_KEY`), mesmo padrão de `aiService.analyzeScreenshot` |
| Banco | **Zero migrations** — `reference_month`, `created_at`, `vehicle_id` já suportados |
| Fora de escopo | Import em lote por Excel; tela genérica de despesas em `CostsPeriod.tsx` |

---

## 3. Arquitetura

```
ImageEditorModal (confirma foto)
        │  File
        ▼
FuelExpenseScreen.handleSaveEditedImage
        │  compressForUpload (≤1600px, jpeg q0.8)
        ▼
fuelReceiptService.extractFuelReceipt(file)
        │  Gemini gemini-flash-latest + responseSchema JSON
        │  prompt tolerante a layout (rótulo/semântica, não posição)
        ▼
FuelReceiptExtraction { plate?, date?, odometer?, fuelQuantity?, totalValue?, station? }
        │
        ├─ placa  → resolve/search do campo "Veículo (Placa)"
        ├─ data   → campo Data (só se extraída) + referenceMonth/createdAt
        ├─ litros → form.fuelQuantity   (autoFilled)
        └─ valor  → form.totalValue     (autoFilled)
```

### 3.1 `services/ai/fuelReceiptService.ts` + `services/ai/fuelReceiptParser.ts` (novos)

- `fuelReceiptService.extractFuelReceipt(file: File): Promise<FuelReceiptExtraction>`
  1. Compressão prévia via `imageCompressionService.compressForUpload`
     (maxDimension 1600, jpeg, q0.80) → base64 (economiza tokens).
  2. `GoogleGenerativeAI` + modelo `gemini-flash-latest`, com
     `generationConfig.responseMimeType: 'application/json'` e `responseSchema`
     (padrão de `services/ai/geminiService.ts`).
  3. Parser tolerante (`extractFuelReceiptJson`: JSON direto → fences ``` → regex
     `\{[\s\S]*\}`) — padrão de `aiSsCreationService.ts:10-40`.
- `fuelReceiptParser.ts` concentra a **parte pura** (sem `import.meta.env`,
  testável no Jest): `parseReceiptNumber` (aceita `1.234,56` e `1234.56`),
  `parseReceiptDate`, `normalizeReceiptPlate` (reusa
  `fuelExpenseImportService.normalizePlate`), `extractFuelReceiptJson` e
  `normalizeFuelReceiptExtraction`.
- **Prompt tolerante a layout**: "o layout varia por estabelecimento; localize
  cada campo por rótulo/semântica (TOTAL A PAGAR, VALOR, LITROS, QTD.,
  ODÔMETRO/KM, PLACA, DATA/HORA), nunca por posição; se não encontrar com
  certeza, retorne `null`; não invente valores".
- Erros mapeados em PT-BR (API_KEY / quota / modelo / rede) — mesmos de
  `aiService.analyzeScreenshot` (`aiService.ts:81-96`).

### 3.2 `views/Vehicles/FuelExpenseScreen.tsx` (alterado)

- Estado: `isExtracting`, `autoFilled: Set<'fuelQuantity'|'totalValue'|'odometer'|'date'|'vehicle'>`.
- Extração disparada em `handleSaveEditedImage` (após `setImage`).
- Indicadores: card "Lendo o comprovante com IA…" com spinner sob o campo
  Comprovante; aviso "Dados pré-preenchidos pela leitura do comprovante —
  confira antes de salvar" quando algum campo foi auto-preenchido; `toast` de
  sucesso ("Dados lidos do comprovante — confira antes de salvar") ou de aviso
  quando a leitura não identificou nada.
- **Placa**: preenche `search` → debounce existente lista os matches;
  match único por `normalizePlate` seleciona o veículo. Veículo já selecionado
  com placa divergente → `toast.warning` (não troca sozinho).
- **Data**: novo campo `type="date"` renderizado **somente** quando extraída;
  apagar o campo volta ao modo manual.
- **Submit**: `referenceMonth` e `createdAt` conforme §2 (tabela de regras);
  validação de competência alocada/fechada usa o `referenceMonth` derivado.

---

## 4. Regras de data/hora (crítico)

| Origem | `createdAt` gravado | `referenceMonth` |
|---|---|---|
| Manual (sem leitura, ou data apagada) | `new Date().toISOString()` | mês corrente |
| Extração da imagem | `${date}T12:00:00.000Z` (data do cupom) | `date.slice(0,7)` |

Mesmo padrão do import em lote (`FuelExpenseImportModal.tsx:195`). Se o cupom
for de outro mês (lançamento atrasado), a trava de competência cai sobre o mês
do documento automaticamente.

---

## 5. Testes e verificação

- `services/ai/fuelReceiptService.test.ts` — números pt-BR/en, datas
  (DD/MM/AAAA e ISO), placa (hífen/acentos/marca d'água), JSON com fences,
  campos ausentes (null).
- `npx tsc --noEmit` e `npm test` após as mudanças.

---

## 6. Requisitos de ambiente

- `VITE_GEMINI_API_KEY` configurada (já usada pelo chat/assistente do SIGES).
- Sem novas credenciais, sem novas tabelas/colunas.
