/**
 * Barra de progresso usada durante upload e processamento do CSV.
 */

import { byId } from "../utils/dom.js";

/** Mostra a barra com o valor atual (0–100). */
export function mostrarProgresso(valor) {
  const container = byId("progresso-container");
  const barra = byId("progresso");
  if (!container || !barra) return;
  container.style.display = "block";
  barra.style.width = valor + "%";
}

/** Esconde a barra após um pequeno delay (deixa o usuário ver chegar a 100%). */
export function esconderProgresso() {
  setTimeout(() => {
    const container = byId("progresso-container");
    const barra = byId("progresso");
    if (container) container.style.display = "none";
    if (barra) barra.style.width = "0%";
  }, 600);
}
