/**
 * Helpers genéricos para modais (config, ajuda, envio).
 *
 * Os modais usam o atributo `hidden` como mecanismo de visibilidade
 * (via atributo HTML, com fallback CSS em styles/components/modal.css).
 *
 * Convenção: ao abrir, trava o scroll do body (`overflow: hidden`)
 * para evitar scroll duplo embaixo do backdrop.
 */

import { byId, $$, setHidden } from "../utils/dom.js";

/** Abre o modal pelo id e trava o scroll. */
export function abrirModal(id) {
  setHidden(id, false);
  document.body.style.overflow = "hidden";
}

/** Fecha o modal pelo id e libera o scroll. */
export function fecharModal(id) {
  setHidden(id, true);
  document.body.style.overflow = "";
}

/** Fecha todos os modais visíveis (usado pelo Esc e por clique no backdrop). */
export function fecharTodosModais() {
  $$(".modal:not([hidden])").forEach((m) => m.setAttribute("hidden", ""));
  document.body.style.overflow = "";
}

/**
 * Listener global: ao clicar no backdrop (.modal mas não no .modal-content),
 * fecha o modal correspondente.
 */
export function initModalBackdrop() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.setAttribute("hidden", "");
      document.body.style.overflow = "";
    }
  });
}
