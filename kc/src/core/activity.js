/**
 * Detecção e formatação de atividades (KCs e Labs).
 *
 * Convenção do Canvas: colunas começam com número e contêm "KC" ou "Lab"
 * em alguma posição (ex: "01-KC-Cloud Foundations").
 */

import { normalize } from "../utils/string.js";

/** True se o nome da coluna representa um Knowledge Check. */
export function isKC(col) {
  return /^\d+.*kc/.test(normalize(col));
}

/** True se o nome da coluna representa um Lab. */
export function isLab(col) {
  return /^\d+.*lab/.test(normalize(col));
}

/**
 * Formata o nome da atividade de forma legível.
 * Ex: "01-KC-Cloud Foundations (1234)" → "01 - KC - Cloud Foundations".
 */
export function formatarNomeAtividade(col) {
  let nome = col.replace(/\(\d+\)/g, "").trim();
  const match = nome.match(/^(\d+)(.*)/);
  if (!match) return nome;

  const numero = match[1].trim();
  let resto = match[2].trim();

  const tipoMatch = resto.match(
    /[-\s\[_]*(?:[A-Z]{1,4}[-\s\[_]*)*?(KC|Lab|LAB|kc|lab)(.*)/i
  );

  if (tipoMatch) {
    const tipo = tipoMatch[1].toUpperCase() === "LAB" ? "Lab" : tipoMatch[1].toUpperCase();
    let titulo = tipoMatch[2].trim();
    titulo = titulo.replace(/^[-\s—–]+/, "").trim();
    titulo = titulo.replace(/\s*-{2,}\s*/g, " - ").trim();
    return `${numero} - ${tipo} - ${titulo}`;
  }

  resto = resto.replace(/^[-\s—–]+/, "").trim();
  return `${numero} - ${resto}`;
}
