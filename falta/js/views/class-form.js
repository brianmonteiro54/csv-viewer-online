/**
 * View "Criar / Editar turma".
 * O mesmo componente cobre os dois modos — distingue por classId.
 *
 * Modo opcional de e-mails:
 *   O usuário pode clicar em "📧 Incluir e-mails dos alunos (opcional)" para
 *   habilitar um formato estendido onde cada linha vira:
 *       Nome do aluno [TAB ou espaços] email@dominio.com
 *   Quando habilitado e ao menos um e-mail é parseado, a turma ganha o
 *   atributo `emails: { nome: email }`, que destrava o botão "Enviar e-mail"
 *   na tela de resultado. Sem isso, a turma se comporta como antes.
 */
import { STORE, saveStore, uid } from '../storage.js';
import { escapeHtml, toast } from '../ui.js';
import { navigate } from '../router.js';

/** Detecta um e-mail "razoável" em uma linha (algo@algo.algo). */
const EMAIL_RE = /([^\s@]+@[^\s@]+\.[^\s@]+)/;

/**
 * Parseia uma única linha da textarea.
 * - Em modo só-nome: a linha inteira é o nome.
 * - Em modo com e-mail: extrai o e-mail (se houver) e o nome é o que sobra
 *   antes dele. Linhas sem e-mail continuam válidas como aluno (só não
 *   recebem o botão de envio).
 */
function parseLine(line, emailMode) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (!emailMode) return { name: trimmed, email: null };

  const m = trimmed.match(EMAIL_RE);
  if (!m) return { name: trimmed, email: null };
  const email = m[1].trim();
  const name = trimmed.slice(0, m.index).trim();
  if (!name) return null; // só um e-mail, sem nome → ignora
  return { name, email };
}

/** Serializa as linhas para texto no formato do modo escolhido. */
function serialize(entries, emailMode) {
  return entries.map(e => {
    if (emailMode && e.email) return `${e.name}\t${e.email}`;
    return e.name;
  }).join('\n');
}

/** Texto inicial quando estamos editando uma turma já existente. */
function initialText(existing, emailMode) {
  if (!existing) return '';
  const students = existing.students || [];
  const emails = existing.emails || {};
  return students.map(s => ({ name: s, email: emails[s] || null }))
                 .reduce((acc, e) => (acc.push(e), acc), [])
                 .map(e => (emailMode && e.email) ? `${e.name}\t${e.email}` : e.name)
                 .join('\n');
}

export function renderClassForm(root, classId) {
  const existing = classId ? STORE.classes[classId] : null;
  const isEdit = !!existing;

  // Estado local da view
  let emailMode = !!(existing && existing.emails && Object.keys(existing.emails).length);
  let currentText = initialText(existing, emailMode);
  let currentName = existing?.name || '';

  /**
   * (Re)pinta a view inteira usando `emailMode`, `currentText` e `currentName`.
   * Mantém o que o usuário já tinha digitado mesmo quando o toggle re-renderiza
   * o formulário.
   */
  function paint() {
    root.innerHTML = `
      <a class="back-link" id="back">← Voltar</a>
      <div class="card">
        <h2 class="card-title" style="margin-bottom: 18px;">${isEdit ? '✏️ Editar turma' : '＋ Nova turma'}</h2>

        <div class="field">
          <label for="className">Nome da turma</label>
          <input type="text" id="className" placeholder="Ex: IA-01, Turma da manhã, etc" value="${escapeHtml(currentName)}">
        </div>

        <div class="email-toggle-row">
          <button type="button" class="email-toggle ${emailMode ? 'on' : ''}" id="emailToggle" aria-pressed="${emailMode}">
            <span class="email-toggle-switch" aria-hidden="true">
              <span class="email-toggle-knob"></span>
            </span>
            <span class="email-toggle-label">
              📧 Incluir e-mails dos alunos
              <span class="email-toggle-optional">(opcional)</span>
            </span>
          </button>
          <p class="email-toggle-hint">${emailMode
            ? '✅ Modo ativado — cole nomes <strong>e</strong> e-mails. Desative para voltar ao modo só-nomes.'
            : 'Habilite para destravar o botão de <strong>“Enviar e-mail”</strong> aos alunos que faltarem.'}</p>
        </div>

        <div class="field">
          <label for="studentList">${emailMode
            ? 'Lista de alunos com e-mail (um por linha)'
            : 'Lista de alunos (um por linha)'}</label>
          <textarea id="studentList"
            placeholder="${emailMode
              ? 'Fulano de Tal Silva\tFulanodeTalSilva@gmail.com&#10;Beltrano Santos\tBeltrano.Santos@gmail.com&#10;Nome e Sobrenome\tNomeeSobrenome@gmail.com&#10;...'
              : 'Fulano de Tal Silva&#10;Ciclano Beltrano Santos&#10;Nome e Sobrenome&#10;...'}"
            spellcheck="false">${escapeHtml(currentText)}</textarea>
          <span class="hint">${emailMode
            ? 'Formato: <code>Nome do aluno</code> + TAB ou espaços + <code>email@dominio.com</code>. Linhas sem e-mail seguem valendo como aluno (só não recebem botão de envio).'
            : 'Cole os nomes diretamente. Linhas em branco são ignoradas.'}</span>
        </div>

        <div class="row-flex" style="margin-top: 18px;">
          <button class="btn-primary" id="saveBtn">${isEdit ? '💾 Salvar alterações' : '✅ Criar turma'}</button>
          <button class="btn-ghost" id="cancelBtn">Cancelar</button>
        </div>
      </div>
    `;

    const backToOrigin = () => navigate(isEdit ? { name: 'class', classId } : { name: 'home' });
    document.getElementById('back').onclick = backToOrigin;
    document.getElementById('cancelBtn').onclick = backToOrigin;

    // Mantém currentText e currentName sincronizados com o que o usuário
    // digita, pra não perder em re-renders disparados pelo toggle.
    const textarea = document.getElementById('studentList');
    textarea.addEventListener('input', () => { currentText = textarea.value; });

    const nameInput = document.getElementById('className');
    nameInput.addEventListener('input', () => { currentName = nameInput.value; });

    document.getElementById('emailToggle').onclick = () => {
      // Lê o que está na tela agora
      const raw = textarea.value;
      // Parseia no modo CORRENTE (antes da troca) — assim sabemos o que cada
      // linha representa de fato.
      const parsed = raw.split('\n').map(l => parseLine(l, emailMode)).filter(Boolean);
      // Troca o modo
      emailMode = !emailMode;
      // Re-serializa para o NOVO modo, preservando dados
      currentText = serialize(parsed, emailMode);
      paint();
    };

    document.getElementById('saveBtn').onclick = save;
  }

  function save() {
    const name = document.getElementById('className').value.trim();
    const studentsRaw = document.getElementById('studentList').value;
    if (!name) { toast('Coloque um nome para a turma', 'warning'); return; }

    const parsed = studentsRaw.split('\n').map(l => parseLine(l, emailMode)).filter(Boolean);
    if (parsed.length === 0) { toast('Adicione ao menos um aluno', 'warning'); return; }

    // De-dup por nome (case-insensitive) mantendo a primeira ocorrência
    const seen = new Set();
    const dedup = [];
    for (const p of parsed) {
      const key = p.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(p);
    }

    const students = dedup.map(p => p.name);
    const emails = {};
    if (emailMode) {
      for (const p of dedup) if (p.email) emails[p.name] = p.email;
    }
    const hasAnyEmail = Object.keys(emails).length > 0;

    if (isEdit) {
      existing.name = name;
      existing.students = students;
      if (emailMode && hasAnyEmail) existing.emails = emails;
      else delete existing.emails; // modo off → desabilita feature pra essa turma
      saveStore(STORE);
      toast('Turma atualizada', 'success');
      navigate({ name: 'class', classId });
    } else {
      const id = uid();
      const cls = { id, name, students, aliases: {}, createdAt: new Date().toISOString() };
      if (emailMode && hasAnyEmail) cls.emails = emails;
      STORE.classes[id] = cls;
      saveStore(STORE);
      toast(hasAnyEmail
        ? `Turma criada — ${Object.keys(emails).length} e-mail${Object.keys(emails).length === 1 ? '' : 's'} cadastrado${Object.keys(emails).length === 1 ? '' : 's'}`
        : 'Turma criada', 'success');
      navigate({ name: 'class', classId: id });
    }
  }

  paint();
}
