/**
 * View "Detalhes da turma" — mostra alunos, upload de CSV e dropzone.
 * Quando um CSV é processado, navega para a view de resultados.
 */
import { STORE } from '../storage.js';
import { escapeHtml, toast } from '../ui.js';
import { navigate } from '../router.js';
import { openAliasesModal } from '../modals.js';
import { parseCSV, parseMeetingInfo } from '../csv-parser.js';
import { matchOne } from '../name-matching.js';

export function renderClass(root, classId) {
  const cls = STORE.classes[classId];
  if (!cls) { navigate({ name: 'home' }); return; }
  const aliasCount = Object.keys(cls.aliases || {}).length;

  root.innerHTML = `
    <a class="back-link" id="back">← Todas as turmas</a>
    <div class="class-header-row">
      <div>
        <h2 class="class-h1">${escapeHtml(cls.name)}</h2>
        <div class="class-meta">
          <span class="pill">${cls.students.length} alunos</span>
          ${aliasCount ? `<span class="pill learn">🧠 ${aliasCount} apelido${aliasCount === 1 ? '' : 's'} aprendido${aliasCount === 1 ? '' : 's'}</span>` : ''}
        </div>
      </div>
      <div class="actions">
        <button class="btn-ghost btn-sm" id="editBtn">✏️ Editar lista</button>
        ${aliasCount ? `<button class="btn-ghost btn-sm" id="aliasesBtn">🧠 Apelidos</button>` : ''}
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3 class="card-title">📤 Importar CSV do Meet</h3>
        <span class="card-hint">Exporte pela extensão Meet Attendance</span>
      </div>
      <label class="dropzone" id="uploadZone">
        <input type="file" id="csvInput" accept=".csv,text/csv">
        <div class="dropzone-icon">📁</div>
        <p class="dropzone-text"><strong>Arraste o CSV aqui</strong> ou <span class="dropzone-link">clique para selecionar</span></p>
        <p class="dropzone-hint">Apenas arquivos .csv exportados do Google Meet</p>
      </label>
    </div>

    <div class="section-head">
      <h2>👥 Alunos da turma</h2>
      <span class="count">${cls.students.length}</span>
    </div>
    <div class="card">
      <div class="students-columns" id="studentsBox"></div>
    </div>
  `;

  document.getElementById('back').onclick = () => navigate({ name: 'home' });
  document.getElementById('editBtn').onclick = () => navigate({ name: 'editClass', classId });
  if (aliasCount) document.getElementById('aliasesBtn').onclick = () => openAliasesModal(cls);

  // Render dos alunos em colunas
  const sbox = document.getElementById('studentsBox');
  const sorted = [...cls.students].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  sbox.innerHTML = sorted.map(s => `<div class="student">${escapeHtml(s)}</div>`).join('');

  // Dropzone + input
  const input = document.getElementById('csvInput');
  const dz = document.getElementById('uploadZone');

  input.onchange = (e) => handleCsv(e.target.files[0], cls);

  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, (e) => {
    e.preventDefault(); e.stopPropagation(); dz.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, (e) => {
    e.preventDefault(); e.stopPropagation(); dz.classList.remove('dragover');
  }));
  dz.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f) handleCsv(f, cls);
  });
}

/**
 * Lê o CSV, faz o match de todos os nomes e navega para a view de resultados.
 * @param {File} file
 * @param {object} cls
 */
function handleCsv(file, cls) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const meetNames = parseCSV(text);
      const info = parseMeetingInfo(text);
      if (!meetNames.length) { toast('CSV vazio ou inválido', 'error'); return; }
      const matches = meetNames.map(n => matchOne(n, cls.students, cls.aliases || {}));
      navigate({ name: 'results', classId: cls.id, payload: { matches, info, filename: file.name } });
    } catch (err) {
      console.error(err);
      toast('Erro ao ler CSV: ' + err.message, 'error');
    }
  };
  reader.readAsText(file, 'UTF-8');
}
