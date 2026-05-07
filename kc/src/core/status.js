/**
 * Classificação de status do aluno.
 *
 * Regras (na ordem):
 *   - graduated: coluna `Graduated Final Points` = 1 (independe das notas)
 *   - green:     KC ≥ critério E Lab ≥ critério
 *   - red:       KC < critério E Lab < critério
 *   - yellow:    apenas um dos critérios atingido
 *
 * Os critérios são editáveis via ⚙️ Configurações.
 */

import { config } from "../config.js";

/**
 * @typedef {"graduated" | "green" | "yellow" | "red"} Status
 */

/** Retorna o status computado para a linha. */
export function getStatus(row) {
  if (row.graduated) return "graduated";
  const kc = parseFloat(row.kc);
  const lab = parseFloat(row.lab);
  if (kc >= config.criterioKC && lab >= config.criterioLab) return "green";
  if (kc < config.criterioKC && lab < config.criterioLab) return "red";
  return "yellow";
}

/** Mapas auxiliares para apresentação do status. */
export const STATUS_LABEL = {
  green: "OK",
  red: "Crítico",
  yellow: "Atenção",
  graduated: "Graduado",
};

export const STATUS_ICON = {
  graduated: "🎓",
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
};

export const STATUS_COLOR = {
  graduated: "#2563eb",
  green: "#16a34a",
  yellow: "#f59e0b",
  red: "#dc2626",
};
