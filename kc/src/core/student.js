/**
 * Funções para detectar alunos que NÃO devem entrar nos cálculos:
 *   1. Contas de teste do Canvas (criadas automaticamente para o instrutor)
 *   2. Alunos que não aceitaram o convite (sem login + zero atividades)
 *   3. Alunos ignorados manualmente pelo usuário (lista persistente)
 */

import { isKC, isLab } from "./activity.js";
import { config } from "../config.js";

/**
 * Detecta contas de teste do Canvas e alunos que não aceitaram o convite.
 *
 * Regras (em ordem):
 *   1. Nome casa com padrão clássico ("aluno, Testar", "Testar aluno", etc.)
 *   2. E-mail é hash hex (sem `@`) — sinal de conta de sistema do Canvas
 *   3. Sem `SIS Login ID` E zero atividades preenchidas — convite não aceito
 *      (conservador: só filtra se NADA foi feito; preserva edge cases reais).
 */
export function isContaTesteAutomatica(rawRow) {
  const studentRaw = (rawRow["Student"] || "").toString().trim();
  // Canvas exporta como "Sobrenome, Nome" — então "aluno, Testar" vira "Testar aluno".
  const nome = studentRaw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const email = (rawRow["SIS Login ID"] || "").toString().trim();

  // 1. Padrões clássicos de conta de teste no nome.
  const padroesNome = [
    /^aluno,\s*testar?$/i,
    /^testar?,\s*aluno$/i,
    /^student,\s*test$/i,
    /^test,\s*student$/i,
    /^testar?\s+aluno$/i,
    /^test\s+student$/i,
  ];
  if (padroesNome.some((p) => p.test(nome))) return true;

  // 2. E-mail é hash hex (sem @).
  if (email && !email.includes("@") && /^[a-f0-9]{20,}$/i.test(email)) return true;

  // 3. Sem SIS Login ID + zero atividades reais.
  if (!email) {
    const temAlgumaAtividade = Object.entries(rawRow).some(([col, val]) => {
      if (!isKC(col) && !isLab(col)) return false;
      return val !== undefined && val !== null && val.toString().trim() !== "";
    });
    if (!temAlgumaAtividade) return true;
  }

  return false;
}

/**
 * Verifica se um aluno deve ser ignorado:
 *   - por auto-detecção (conta de teste / convite não aceito), OU
 *   - pela lista manual do usuário (config.alunosIgnorados).
 */
export function isAlunoIgnorado(rawRow) {
  if (isContaTesteAutomatica(rawRow)) return true;
  const email = (rawRow["SIS Login ID"] || "").toString().trim().toLowerCase();
  const id = (rawRow["ID"] || "").toString().trim();
  return config.alunosIgnorados.some((ign) => {
    const chave = (ign.chave || "").toLowerCase();
    return chave === email || ign.chave === id;
  });
}
