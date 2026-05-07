/**
 * Helpers de manipulação de strings para casamento case/acento-insensível.
 */

/**
 * Normaliza texto: lowercase + remove acentos + trim.
 * Usada em comparações e detecções (case-insensitive).
 */
export function normalize(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Normaliza código de turma para tolerar typos comuns.
 *
 * Caso real: "BRASAOXXX" (com 'A' a mais) deve casar com "BRSAOXXX" (forma do Canvas).
 * Heurística: se começar com "BRA" seguido de pelo menos 2 letras maiúsculas
 * (padrão "BR + cidade"), remove o "A" extra.
 *
 * Exemplos: BRASAO → BRSAO · BRARJ → BRRJ · BRABSB → BRBSB
 */
export function normalizarSectionKey(s) {
  if (!s) return "";
  let key = s.toString().toUpperCase().trim();
  if (/^BRA[A-Z]{2,}/.test(key)) {
    key = "BR" + key.slice(3);
  }
  return key;
}
