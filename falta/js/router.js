/**
 * Roteador minimalista in-memory.
 * Não usa hash nem History API — a aplicação é uma SPA pequena e
 * o estado de navegação não precisa ser refletido na URL.
 *
 * As views são importadas dinamicamente para evitar dependências circulares:
 * router → view → router (navigate).
 *
 * Hooks: módulos externos (ex: main.js) podem registrar callbacks que rodam
 * após cada render, úteis pra atualizar elementos do shell (header, etc).
 */
import { renderHome } from './views/home.js';
import { renderClassForm } from './views/class-form.js';
import { renderClass } from './views/class-detail.js';
import { renderResults } from './views/results.js';

let CURRENT_VIEW = { name: 'home' };
const RENDER_HOOKS = [];

/**
 * Registra um callback que será executado após cada render.
 * Usado, por exemplo, pra atualizar a visibilidade do botão ⚙️ no header
 * quando o STORE muda (turmas criadas/editadas/apagadas).
 */
export function registerRenderHook(fn) {
  if (typeof fn === 'function' && !RENDER_HOOKS.includes(fn)) RENDER_HOOKS.push(fn);
}

/** Retorna a view atual (somente leitura — pra hooks consultarem). */
export function getCurrentView() { return CURRENT_VIEW; }

/**
 * Navega para uma nova view e re-renderiza.
 * @param {{name: string, classId?: string, payload?: any}} view
 */
export function navigate(view) {
  CURRENT_VIEW = view;
  render();
  window.scrollTo({ top: 0 });
}

/** Re-renderiza a view atual no `<main id="app">`. */
export function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const v = CURRENT_VIEW;
  if (v.name === 'home')          renderHome(app);
  else if (v.name === 'newClass') renderClassForm(app, null);
  else if (v.name === 'editClass')renderClassForm(app, v.classId);
  else if (v.name === 'class')    renderClass(app, v.classId);
  else if (v.name === 'results')  renderResults(app, v.classId, v.payload);
  else renderHome(app);
  for (const hook of RENDER_HOOKS) {
    try { hook(); } catch (e) { console.error('Render hook error:', e); }
  }
}
