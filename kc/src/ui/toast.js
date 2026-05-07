/**
 * Sistema de notificação toast (canto inferior direito).
 *
 * Os toasts auto-removem após ~3.5s. Tipos suportados:
 *   - "success" (default) — verde
 *   - "error"             — vermelho
 *   - "warning"           — amarelo
 *   - "info"              — azul
 *
 * Os estilos correspondentes ficam em styles/components/toast.css
 * (classes .toast-{tipo}).
 */

import { byId } from "../utils/dom.js";

/** Exibe um toast. */
export function toast(msg, tipo = "success") {
  const container = byId("toast-container");
  if (!container) return;

  const el = document.createElement("div");
  el.className = `toast toast-${tipo}`;
  el.innerText = msg;
  container.appendChild(el);

  // Pequeno delay para o CSS aplicar a transição de entrada.
  setTimeout(() => el.classList.add("show"), 10);

  // Auto-remove após 3.5s (com transição de saída).
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3500);
}
