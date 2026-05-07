/**
 * Utilitários de DOM — wrappers leves sobre a API do browser.
 * Mantém o código mais legível e evita repetir document.querySelector toda hora.
 */

/** Retorna o primeiro elemento que casa com o seletor (ou null). */
export const $ = (selector, root = document) => root.querySelector(selector);

/** Retorna todos os elementos como Array (não NodeList) — permite .map / .filter. */
export const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

/** Atalho para document.getElementById. */
export const byId = (id) => document.getElementById(id);

/**
 * Esconde/mostra um elemento via atributo `hidden`.
 * Aceita id (string) ou o próprio elemento.
 */
export function setHidden(elOrId, hidden) {
  const el = typeof elOrId === "string" ? byId(elOrId) : elOrId;
  if (!el) return;
  if (hidden) el.setAttribute("hidden", "");
  else el.removeAttribute("hidden");
}

/**
 * Event delegation: escuta um evento no `root` e dispara o handler
 * apenas se o alvo (ou um ancestral dele) casar com o seletor.
 *
 * Útil para elementos criados dinamicamente (linhas da tabela, listas etc.).
 *
 * @example
 * delegate(document.body, "click", "[data-action='salvar']", (e, btn) => { ... });
 */
export function delegate(root, event, selector, handler) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  });
}
