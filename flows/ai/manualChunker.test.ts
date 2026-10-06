/**
 * Testes do chunker de manuais técnicos (chunking puro, sem rede/banco).
 * Executar: npm test -- manualChunker
 */
import { chunkManualText } from '../../services/ai/manualChunker';

describe('manualChunker', () => {
  it('retorna vazio para texto vazio/só ruído', () => {
    expect(chunkManualText('')).toEqual([]);
    expect(chunkManualText('   \n\n  ')).toEqual([]);
  });

  it('divide por headings numerados e caps (seções grandes não são mescladas)', () => {
    const body = 'Desligue o equipamento antes de iniciar e siga o procedimento de segurança. ';
    const text = [
      'INTRODUÇÃO',
      body,
      '',
      '1. TROCA DO FILTRO',
      body.repeat(25), // ~2.100 chars → seção independente
      '',
      '2. LUBRIFICAÇÃO',
      body.repeat(25),
    ].join('\n');

    const chunks = chunkManualText(text);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks.some(c => c.text.startsWith('1. TROCA DO FILTRO'))).toBe(true);
    expect(chunks.some(c => c.text.startsWith('2. LUBRIFICAÇÃO'))).toBe(true);
  });

  it('divide texto longo em chunks dentro do limite e preserva conteúdo', () => {
    const paragraph = 'O equipamento deve ser inspecionado visualmente quanto a vazamentos e corrosão. ';
    const text = Array(80).fill(paragraph).join('\n\n'); // ~8.000 chars

    const chunks = chunkManualText(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(2100); // margem do MAX_SIZE
      expect(chunk.text.trim().length).toBeGreaterThan(0);
    }
    // Conteúdo preservado (amostra do início e do fim)
    const all = chunks.map(c => c.text).join(' ');
    expect(all).toContain('vazamentos');
  });

  it('propaga o número da página em todos os chunks', () => {
    const chunks = chunkManualText('TEXTO DA PÁGINA\nConteúdo relevante do manual técnico para busca semântica.', 7);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every(c => c.pageNumber === 7)).toBe(true);
  });

  it('descarta fragmentos mínimos (lixo de extração)', () => {
    const chunks = chunkManualText('A\nB\n\nC');
    expect(chunks).toEqual([]);
  });

  it('mescla seções pequenas até o alvo e mantém índice sequencial', () => {
    const paragraph = 'Parágrafo de teste com conteúdo técnico suficiente para virar um chunk válido. ';
    const chunks = chunkManualText(Array(30).fill(paragraph).join('\n\n')); // ~2.400 chars > MAX_SIZE
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c, i) => expect(c.index).toBe(i));
  });
});
