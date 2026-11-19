// Ordem das colunas (líderes) do quadro da Programação Diária. Função pura, sem banco.

/**
 * Líderes em ordem alfabética pelo nome, ignorando maiúsculas e acentos
 * ("José" fica entre "Jorge" e "Jota"). Nomes iguais mantêm a ordem original
 * (equipes por sort_order). Não altera o array recebido.
 */
export const sortColumnsByLeaderName = <T extends { leaderName: string }>(columns: T[]): T[] =>
    [...columns].sort((a, b) => a.leaderName.localeCompare(b.leaderName, 'pt-BR', { sensitivity: 'base' }));
