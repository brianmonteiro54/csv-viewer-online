/**
 * Entry point da aplicação.
 *
 * Carregado como ES module via <script type="module"> no index.html.
 * É o único arquivo que toca o DOM "global" do shell (header, brand, help
 * button, settings button). As views se viram com #app dentro do <main>.
 */
import { initTheme } from './theme.js';
import { navigate, render, registerRenderHook, getCurrentView } from './router.js';
import { openHelpModal, openEmailSettingsModal } from './modals.js';
import { STORE } from './storage.js';

// 1. Aplica tema salvo (claro/escuro)
initTheme();

// 2. Conecta o brand (logo) à navegação para Home
document.getElementById('brand').onclick = () => navigate({ name: 'home' });

// 3. Conecta o botão de ajuda
document.getElementById('helpBtn').onclick = openHelpModal;

// 4. Conecta o botão de configuração de e-mail
document.getElementById('emailSettingsBtn').onclick = openEmailSettingsModal;

/**
 * Mostra ou esconde o botão ⚙️ no header baseado na view atual.
 *
 * Regra: o botão é CONTEXTUAL — só aparece quando o usuário está vendo
 * uma turma (ou seu resultado) que foi criada com modo de e-mails. Em
 * qualquer outra view (home, criar/editar turma, ou uma turma sem e-mails)
 * o botão fica escondido. Isso evita que o usuário veja o ⚙️ em telas onde
 * ele não tem aplicação prática.
 */
function applyEmailSettingsVisibility() {
  const btn = document.getElementById('emailSettingsBtn');
  if (!btn) return;
  const view = getCurrentView();
  let show = false;
  if (view && (view.name === 'class' || view.name === 'results')) {
    const cls = STORE.classes?.[view.classId];
    if (cls && cls.emails && Object.keys(cls.emails).length > 0) {
      show = true;
    }
  }
  btn.hidden = !show;
}

// Reavalia a visibilidade depois de cada render — assim o botão aparece/
// some sozinho conforme o usuário navega ou edita uma turma.
registerRenderHook(applyEmailSettingsVisibility);

// 5. Render inicial (já dispara o hook acima)
render();
