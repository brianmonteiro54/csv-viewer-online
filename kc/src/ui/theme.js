/**
 * Tema escuro / claro.
 *
 * Persistência: chave "darkMode" no localStorage.
 * Atalho de teclado: D (configurado em ui/shortcuts.js).
 */

import { byId, $ } from "../utils/dom.js";

const STORAGE_KEY = "darkMode";

/** Aplica a preferência salva (chamado uma vez no boot). */
export function initTheme() {
  if (localStorage.getItem(STORAGE_KEY) === "true") {
    document.body.classList.add("dark");
  }
  updateIcon();
}

/** Alterna o tema e persiste. Re-renderiza gráficos se estiverem visíveis. */
export function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem(STORAGE_KEY, isDark);
  updateIcon();

  // Re-renderiza gráficos para que peguem as cores do novo tema.
  // Import dinâmico para evitar dependência circular: charts.js → theme.js → charts.js.
  const graficos = byId("graficos-container");
  if (graficos && !graficos.hasAttribute("hidden")) {
    import("./charts.js").then((m) => m.renderGraficos());
  }
}

/** Atualiza o ícone do botão (lua/sol) conforme o tema atual. */
function updateIcon() {
  const btn = byId("darkToggleBtn");
  if (!btn) return;
  const isDark = document.body.classList.contains("dark");
  const span = $("span", btn);
  if (span) span.textContent = isDark ? "☀️" : "🌙";
}

/** True se o tema escuro está ativo (útil para outros módulos como charts). */
export function isDarkMode() {
  return document.body.classList.contains("dark");
}
