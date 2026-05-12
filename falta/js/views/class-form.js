/**
 * View "Criar / Editar turma".
 * O mesmo componente cobre os dois modos — distingue por classId.
 */
import { STORE, saveStore, uid } from '../storage.js';
import { escapeHtml, toast } from '../ui.js';
import { navigate } from '../router.js';
import { openConfirm } from '../modals.js';

export function renderClassForm(root, classId) {
  const existing = classId ? STORE.classes[classId] : null;
  const isEdit = !!existing;

  root.innerHTML = `
    <a class="back-link" id="back">← Voltar</a>
    <div class="card">
      <h2 class="card-title" style="margin-bottom: 18px;">${isEdit ? '✏️ Editar turma' : '＋ Nova turma'}</h2>
      <div class="field">
        <label for="className">Nome da turma</label>
        <input type="text" id="className" placeholder="Ex: IA-01, Turma da manhã, etc" value="${escapeHtml(existing?.name || '')}">
      </div>
      <div class="field">
        <label for="studentList">Lista de alunos (um por linha)</label>
        <textarea id="studentList" placeholder="Agatha Luiza Souza Da Costa&#10;Alexsandro Oliveira Ribas&#10;Aline Suelen Da Silva&#10;..." spellcheck="false">${escapeHtml((existing?.students || []).join('\n'))}</textarea>
        <span class="hint">Cole os nomes diretamente. Linhas em branco são ignoradas.</span>
      </div>
      <div class="row-flex" style="justify-content: space-between; margin-top: 18px;">
        <div class="row-flex">
          <button class="btn-primary" id="saveBtn">${isEdit ? '💾 Salvar alterações' : '✅ Criar turma'}</button>
          <button class="btn-ghost" id="cancelBtn">Cancelar</button>
        </div>
        ${isEdit ? `<button class="btn-danger btn-sm" id="deleteBtn">🗑️ Apagar turma</button>` : ''}
      </div>
    </div>
  `;

  const backToOrigin = () => navigate(isEdit ? { name: 'class', classId } : { name: 'home' });
  document.getElementById('back').onclick = backToOrigin;
  document.getElementById('cancelBtn').onclick = backToOrigin;

  document.getElementById('saveBtn').onclick = () => {
    const name = document.getElementById('className').value.trim();
    const studentsRaw = document.getElementById('studentList').value;
    if (!name) { toast('Coloque um nome para a turma', 'warning'); return; }

    const students = studentsRaw.split('\n').map(s => s.trim()).filter(Boolean);
    if (students.length === 0) { toast('Adicione ao menos um aluno', 'warning'); return; }

    if (isEdit) {
      existing.name = name;
      existing.students = students;
      saveStore(STORE);
      toast('Turma atualizada', 'success');
      navigate({ name: 'class', classId });
    } else {
      const id = uid();
      STORE.classes[id] = { id, name, students, aliases: {}, createdAt: new Date().toISOString() };
      saveStore(STORE);
      toast('Turma criada', 'success');
      navigate({ name: 'class', classId: id });
    }
  };

  if (isEdit) {
    document.getElementById('deleteBtn').onclick = () => {
      openConfirm(`Apagar a turma "${existing.name}"?`, 'Esta ação não pode ser desfeita.', () => {
        delete STORE.classes[classId];
        saveStore(STORE);
        toast('Turma apagada', 'info');
        navigate({ name: 'home' });
      });
    };
  }
}
