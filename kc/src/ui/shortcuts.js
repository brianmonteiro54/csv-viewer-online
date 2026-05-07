/**
 * Atalhos de teclado globais.
 *
 *   /   → foco na busca
 *   Esc → fecha modais e limpa busca
 *   D   → alterna tema escuro
 */

import { byId } from "../utils/dom.js";
import { fecharTodosModais } from "./modal.js";
import { toggleDarkMode } from "./theme.js";
import { renderTable } from "./table.js";

/** Conecta os atalhos no documento. Deve ser chamado uma vez no boot. */
export function initShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Não interfere quando o usuário está digitando em campos de texto.
    const inField = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);

    if (e.key === "/" && !inField) {
      e.preventDefault();
      const search = byId("search");
      if (search) search.focus();
      return;
    }

    if (e.key === "Escape") {
      fecharTodosModais();

      // Se a busca está focada e tem texto, limpa-a também.
      const search = byId("search");
      if (search && search.value && document.activeElement === search) {
        search.value = "";
        byId("searchClear").hidden = true;
        renderTable();
      }
      return;
    }

    if ((e.key === "d" || e.key === "D") && !inField) {
      toggleDarkMode();
    }
  });
}
