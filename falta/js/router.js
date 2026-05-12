/**
 * Roteador minimalista in-memory.
 * Não usa hash nem History API — a aplicação é uma SPA pequena e
 * o estado de navegação não precisa ser refletido na URL.
 *
 * As views são importadas dinamicamente para evitar dependências circulares:
 * router → view → router (navigate).
 */
import { renderHome } from './views/home.js';
import { renderClassForm } from './views/class-form.js';
import { renderClass } from './views/class-detail.js';
import { renderResults } from './views/results.js';

let CURRENT_VIEW = { name: 'home' };

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
}
