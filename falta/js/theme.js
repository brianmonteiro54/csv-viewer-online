/**
 * Gerencia o tema (claro/escuro) com persistência no localStorage
 * e fallback para a preferência do sistema (prefers-color-scheme).
 */

const THEME_KEY = 'presenca_theme';

/** Aplica visualmente o tema e atualiza o ícone do botão. */
function applyTheme(theme) {
  if (theme === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  const btn = document.getElementById('darkToggleBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/** Lê o tema salvo, ou cai no preferences do sistema. */
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let THEME = loadTheme();

/**
 * Inicializa o tema (aplica + conecta o botão de toggle).
 * Chamado uma única vez no boot do app.
 */
export function initTheme() {
  applyTheme(THEME);
  const btn = document.getElementById('darkToggleBtn');
  if (btn) {
    btn.onclick = () => {
      THEME = THEME === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, THEME);
      applyTheme(THEME);
    };
  }
}
