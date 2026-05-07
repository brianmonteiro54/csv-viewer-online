/**
 * Estado global da aplicação.
 *
 * Mantém um único objeto compartilhado entre módulos. Os módulos importam
 * `state` e leem/escrevem suas propriedades — evita variáveis globais
 * espalhadas pelo código original.
 *
 * Convenção: módulos NUNCA reatribuem `state` (ex: `state = ...`), apenas
 * mutam suas propriedades (ex: `state.globalData = ...`). Isso preserva a
 * referência compartilhada.
 */
export const state = {
  /** Alunos processados, prontos para renderização. */
  globalData: [],

  /** Dados crus do CSV, guardados para reprocessamento sem re-upload. */
  rawCSVData: null,

  /** Filtro ativo na tabela: "all" | "red" | "yellow" | "green" | "graduated". */
  currentFilter: "all",

  /** Critério de ordenação atual da tabela. */
  currentSort: { key: "total", asc: false },

  /** Arquivo aguardando confirmação após o preview. */
  pendingFile: null,

  /** Resultado do parse + validação do arquivo pendente. */
  pendingPreview: null,

  /** Instância do gráfico de status (Chart.js) — null quando não renderizado. */
  chartStatus: null,

  /** Instância do gráfico de média (Chart.js). */
  chartMedia: null,

  /** Fila de envio em massa (alunos selecionados pelo status). */
  envioFila: [],

  /** Próximo índice a ser aberto na fila de envio. */
  envioIndex: 0,
};
