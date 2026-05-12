/**
 * Utilitários de UI puros: escape de HTML e toasts.
 * Sem dependências internas — pode ser importado por qualquer módulo.
 */

/**
 * Escapa caracteres HTML para evitar injeção em strings interpoladas.
 * @param {string} s
 * @returns {string}
 */
export function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/**
 * Exibe um toast (notificação flutuante) no canto inferior direito.
 * @param {string} msg
 * @param {'success'|'error'|'info'|'warning'} [kind='info']
 */
export function toast(msg, kind = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast toast-' + kind;
  el.textContent = msg;
  container.appendChild(el);
  // Trigger animation no próximo frame
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 3000);
}
