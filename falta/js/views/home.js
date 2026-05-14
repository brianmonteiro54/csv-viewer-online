/**
 * View "Home" — lista de turmas + atalho para criar nova.
 * Se não há turmas, mostra empty state.
 */
import { STORE } from '../storage.js';
import { escapeHtml } from '../ui.js';
import { navigate } from '../router.js';

export function renderHome(root) {
  const classes = Object.values(STORE.classes);

  if (classes.length === 0) {
    root.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h2>Comece criando sua primeira turma</h2>
          <p>Cole a lista de alunos uma vez. Depois é só fazer upload do CSV do Meet — a ferramenta identifica quem faltou mesmo quando os alunos colocam só o primeiro nome.</p>
          <button class="btn-primary" id="btnNew">＋ Criar turma</button>
        </div>
      </div>
    `;
    document.getElementById('btnNew').onclick = () => navigate({ name: 'newClass' });
    return;
  }

  root.innerHTML = `
    <div class="section-head">
      <h2>📚 Suas turmas</h2>
      <span class="count">${classes.length} ${classes.length === 1 ? 'turma' : 'turmas'}</span>
    </div>
    <div class="class-grid" id="grid"></div>
  `;

  const grid = document.getElementById('grid');
  classes.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

  for (const c of classes) {
    const studentCount = (c.students || []).length;
    const aliasCount = Object.keys(c.aliases || {}).length;
    const emailCount = Object.keys(c.emails || {}).length;
    const card = document.createElement('button');
    card.className = 'class-card';

    let statsHtml = `<span class="pill">${studentCount} alunos</span>`;
    if (emailCount) {
      statsHtml += `<span class="pill mail">📧 ${emailCount} e-mail${emailCount === 1 ? '' : 's'}</span>`;
    }
    if (aliasCount) {
      statsHtml += `<span class="pill learn">🧠 ${aliasCount} apelido${aliasCount === 1 ? '' : 's'}</span>`;
    }
    card.innerHTML = `
      <div class="name">${escapeHtml(c.name)}</div>
      <div class="stats">${statsHtml}</div>
    `;
    card.onclick = () => navigate({ name: 'class', classId: c.id });
    grid.appendChild(card);
  }

  // Card "Nova turma" no final
  const addCard = document.createElement('button');
  addCard.className = 'class-card new';
  addCard.innerHTML = `<div class="plus">＋</div><div class="name">Nova turma</div>`;
  addCard.onclick = () => navigate({ name: 'newClass' });
  grid.appendChild(addCard);
}
