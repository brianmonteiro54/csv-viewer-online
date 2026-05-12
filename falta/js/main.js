/**
 * Entry point da aplicação.
 *
 * Carregado como ES module via <script type="module"> no index.html.
 * É o único arquivo que toca o DOM "global" do shell (header, brand, help button).
 * As views se viram com #app dentro do <main>.
 */
import { initTheme } from './theme.js';
import { navigate, render } from './router.js';
import { openHelpModal } from './modals.js';

// 1. Aplica tema salvo (claro/escuro)
initTheme();

// 2. Conecta o brand (logo) à navegação para Home
document.getElementById('brand').onclick = () => navigate({ name: 'home' });

// 3. Conecta o botão de ajuda
document.getElementById('helpBtn').onclick = openHelpModal;

// 4. Render inicial
render();
