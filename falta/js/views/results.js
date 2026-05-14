/**
 * View "Resultado da chamada" — a mais complexa do app.
 *
 * Mostra 4 seções:
 *   1. Cards de "Precisam confirmação" (matches duvidosos)
 *   2. Lista de quem faltou
 *   3. Lista de quem está presente (collapsada por padrão)
 *   4. Visitantes / não-alunos
 *
 * Quando o usuário escolhe um aluno num card duvidoso, a aplicação:
 *   - registra a decisão local (decisions)
 *   - aprende o alias na turma (cls.aliases) e persiste
 *   - re-paint da tela inteira (paint()) — barato porque DOM é pequeno
 *   - anima o card com a classe just-saved
 *
 * Botão "📧 Enviar e-mail" — só aparece nas linhas da seção Faltaram se a
 * turma foi criada com o modo de e-mails habilitado (cls.emails existe).
 * Para turmas só-nome, nada muda em relação à versão anterior.
 */
import { STORE, saveStore } from '../storage.js';
import { escapeHtml, toast } from '../ui.js';
import { navigate } from '../router.js';
import { normalize, cleanName } from '../name-matching.js';
import { buildOutlookComposeUrl } from '../email-helper.js';

export function renderResults(root, classId, payload) {
  const cls = STORE.classes[classId];
  if (!cls || !payload) { navigate({ name: 'home' }); return; }

  // Decisões iniciais a partir do output do matcher
  const decisions = {};
  // Cards que o usuário tocou nesta sessão (controla badge "✓ Salvo")
  const userTouched = new Set();
  // Aliases que já existiam no momento do upload (pra mostrar tag "🧠 Lembrado")
  const initialAliases = new Set(Object.keys(cls.aliases || {}));

  for (const m of payload.matches) {
    if (m.kind === 'confident' || m.kind === 'likely') {
      decisions[m.meet] = { type: 'student', studentName: m.top };
    } else if (m.kind === 'instructor' || m.kind === 'visitor') {
      decisions[m.meet] = { type: 'visitor' };
    } else {
      decisions[m.meet] = { type: 'skip' };
    }
  }

  function isFromLearned(meet) {
    return initialAliases.has(normalize(cleanName(meet)));
  }

  function computeStats() {
    const present = new Set();
    let visitors = 0, pending = 0;
    for (const m of payload.matches) {
      const d = decisions[m.meet];
      if (!d) continue;
      if (d.type === 'student' && d.studentName) present.add(d.studentName);
      else if (d.type === 'visitor') visitors++;
      else pending++;
    }
    const absent = cls.students.filter(s => !present.has(s));
    return { present, absent, visitors, pending };
  }

  function paint() {
    const stats = computeStats();
    const learnedCount = payload.matches.filter(m => isFromLearned(m.meet)).length;

    root.innerHTML = `
      <a class="back-link" id="back">← ${escapeHtml(cls.name)}</a>
      <div class="class-header-row">
        <div>
          <h2 class="class-h1">📋 Resultado da chamada</h2>
          <div class="class-meta">
            ${payload.info.created ? `<span class="pill">📅 ${escapeHtml(payload.info.created)}</span>` : `<span class="pill">${escapeHtml(payload.filename)}</span>`}
            ${learnedCount ? `<span class="pill learn">🧠 ${learnedCount} reconhecido${learnedCount === 1 ? '' : 's'} de antes</span>` : ''}
          </div>
        </div>
        <div class="actions">
          <button class="btn-ghost btn-sm" id="copyAbs">📋 Copiar faltas</button>
          <button class="btn-ghost btn-sm" id="restart">🔄 Nova chamada</button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat present"><div class="stat-label">Presentes</div><div class="stat-value">${stats.present.size}</div></div>
        <div class="stat absent"><div class="stat-label">Faltaram</div><div class="stat-value">${stats.absent.length}</div></div>
        <div class="stat review"><div class="stat-label">A revisar</div><div class="stat-value">${stats.pending}</div></div>
        <div class="stat visitor"><div class="stat-label">Visitantes</div><div class="stat-value">${stats.visitors}</div></div>
      </div>

      <div id="reviewArea"></div>
      <div id="absentArea"></div>
      <div id="presentArea"></div>
      <div id="visitorArea"></div>
    `;

    document.getElementById('back').onclick = () => navigate({ name: 'class', classId });
    document.getElementById('restart').onclick = () => navigate({ name: 'class', classId });
    document.getElementById('copyAbs').onclick = () => {
      const absents = computeStats().absent;
      if (!absents.length) { toast('Ninguém faltou hoje 🎉', 'success'); return; }
      const sorted = [...absents].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      navigator.clipboard.writeText(sorted.join('\n')).then(() => {
        toast(`${absents.length} ${absents.length === 1 ? 'nome copiado' : 'nomes copiados'}`, 'success');
      }).catch(() => toast('Erro ao copiar', 'error'));
    };

    renderReviewArea(payload, cls, decisions, userTouched, paint);
    renderAbsentArea(stats, cls);
    renderPresentArea(payload, decisions, isFromLearned);
    renderVisitorArea(payload, decisions, isFromLearned);
  }

  paint();
}

// ---------------------------------------------------------------------
//  SUBSEÇÕES DE PAINT (extraídas pra paint() ficar legível)
// ---------------------------------------------------------------------

function renderReviewArea(payload, cls, decisions, userTouched, repaint) {
  const needReview = payload.matches.filter(m =>
    m.kind === 'ambiguous' || m.kind === 'no_match' || m.kind === 'likely'
  );
  const reviewArea = document.getElementById('reviewArea');
  if (!needReview.length) { reviewArea.innerHTML = ''; return; }

  reviewArea.innerHTML = `
    <div class="section-head">
      <h2>⚠️ Precisam confirmação</h2>
      <span class="count">${needReview.length}</span>
    </div>
    <div class="review-list" id="reviewList"></div>
    <p style="font-size: 13px; color: var(--text-muted); margin: 10px 4px;">
      💡 <em>Suas escolhas são salvas. Da próxima aula, o sistema reconhece automaticamente.</em>
    </p>
  `;
  const list = document.getElementById('reviewList');
  for (const m of needReview) renderReviewCard(list, m, cls, decisions, userTouched, repaint);
}

/**
 * Pinta a seção "Faltaram".
 * Quando a turma tem `cls.emails`, cada linha ganha um botão "📧 Enviar e-mail"
 * que abre o Outlook já pré-preenchido para aquele aluno.
 */
function renderAbsentArea(stats, cls) {
  const absentArea = document.getElementById('absentArea');
  const emailsMap = cls.emails || {};
  const hasEmailFeature = Object.keys(emailsMap).length > 0;

  absentArea.innerHTML = `
    <div class="section-head">
      <h2>❌ Faltaram</h2>
      <span class="count">${stats.absent.length}</span>
    </div>
  `;

  if (stats.absent.length) {
    const listEl = document.createElement('div');
    listEl.className = 'list';
    for (const s of [...stats.absent].sort((a, b) => a.localeCompare(b, 'pt-BR'))) {
      const row = document.createElement('div');
      row.className = 'row';

      // Constrói o conteúdo da direita: badge + (opcional) botão de e-mail
      let rightHtml = '';
      if (hasEmailFeature) {
        const email = emailsMap[s];
        if (email) {
          rightHtml = `
            <a class="btn-email-send"
               href="${escapeHtml(buildOutlookComposeUrl(email, s))}"
               target="_blank" rel="noopener"
               title="Abrir Outlook para enviar e-mail a ${escapeHtml(s)} (${escapeHtml(email)})">
              📧 Enviar e-mail
            </a>
            <span class="badge danger">Faltou</span>`;
        } else {
          // Turma tem feature de e-mail, mas esse aluno específico não tem e-mail
          rightHtml = `
            <span class="email-missing" title="Este aluno não tem e-mail cadastrado">sem e-mail</span>
            <span class="badge danger">Faltou</span>`;
        }
      } else {
        rightHtml = `<span class="badge danger">Faltou</span>`;
      }

      row.innerHTML = `<div class="name"><b>${escapeHtml(s)}</b></div>${rightHtml}`;
      listEl.appendChild(row);
    }
    absentArea.appendChild(listEl);
  } else {
    const empty = document.createElement('div');
    empty.className = 'list';
    empty.innerHTML = `<div class="list-empty">Ninguém faltou. 🎉</div>`;
    absentArea.appendChild(empty);
  }
}

function renderPresentArea(payload, decisions, isFromLearned) {
  const presentArea = document.getElementById('presentArea');
  const presentRows = [];
  for (const m of payload.matches) {
    const d = decisions[m.meet];
    if (!d || d.type !== 'student') continue;
    const meetClean = normalize(cleanName(m.meet));
    const studentClean = normalize(d.studentName);
    presentRows.push({
      student: d.studentName,
      meet: m.meet,
      isExact: meetClean === studentClean,
      fromLearned: isFromLearned(m.meet),
      wasReview: (m.kind === 'likely' || m.kind === 'ambiguous' || m.kind === 'no_match')
    });
  }
  presentRows.sort((a, b) => a.student.localeCompare(b.student, 'pt-BR'));

  presentArea.innerHTML = `
    <div class="section-head">
      <h2>✅ Presentes</h2>
      <span class="count">${presentRows.length}</span>
      <div class="right"><button class="btn-ghost btn-sm" id="togglePresent">Mostrar lista</button></div>
    </div>
    <div id="presentInner" class="hidden"></div>
  `;
  const presentInner = document.getElementById('presentInner');
  const listEl = document.createElement('div');
  listEl.className = 'list';

  for (const r of presentRows) {
    const row = document.createElement('div');
    row.className = 'row';
    const meetTag = r.isExact ? '' : `<span class="meet-tag">${escapeHtml(r.meet)}</span>`;
    let badgeHtml;
    if (r.fromLearned)     badgeHtml = `<span class="badge learn">🧠 Lembrado</span>`;
    else if (r.wasReview)  badgeHtml = `<span class="badge warning">Confirmado</span>`;
    else                   badgeHtml = `<span class="badge success">Presente</span>`;
    row.innerHTML = `<div class="name"><b>${escapeHtml(r.student)}</b>${meetTag}</div>${badgeHtml}`;
    listEl.appendChild(row);
  }
  if (!presentRows.length) listEl.innerHTML = `<div class="list-empty">Nenhum aluno presente.</div>`;
  presentInner.appendChild(listEl);

  document.getElementById('togglePresent').onclick = () => {
    const inner = document.getElementById('presentInner');
    const btn = document.getElementById('togglePresent');
    if (inner.classList.contains('hidden')) {
      inner.classList.remove('hidden');
      btn.textContent = 'Esconder lista';
    } else {
      inner.classList.add('hidden');
      btn.textContent = 'Mostrar lista';
    }
  };
}

function renderVisitorArea(payload, decisions, isFromLearned) {
  const visitorArea = document.getElementById('visitorArea');
  const visitors = payload.matches.filter(m => decisions[m.meet]?.type === 'visitor');
  if (!visitors.length) { visitorArea.innerHTML = ''; return; }

  visitorArea.innerHTML = `
    <div class="section-head">
      <h2>👤 Visitantes / não-alunos</h2>
      <span class="count">${visitors.length}</span>
    </div>
  `;
  const list = document.createElement('div');
  list.className = 'list';
  for (const m of visitors) {
    const row = document.createElement('div');
    row.className = 'row';
    const tag = isFromLearned(m.meet)
      ? `<span class="badge learn">🧠 Lembrado</span>`
      : `<span class="badge mute">Visitante</span>`;
    row.innerHTML = `<div class="name">${escapeHtml(m.meet)}</div>${tag}`;
    list.appendChild(row);
  }
  visitorArea.appendChild(list);
}

// ---------------------------------------------------------------------
//  REVIEW CARD INDIVIDUAL
// ---------------------------------------------------------------------

function renderReviewCard(parent, m, cls, decisions, userTouched, repaint) {
  const card = document.createElement('div');
  card.className = 'review-card';

  const isSaved = userTouched.has(m.meet);
  if (isSaved) card.classList.add('saved');

  const currentDecision = decisions[m.meet];
  let questionText;
  if (m.kind === 'likely')         questionText = 'é provavelmente esta pessoa…';
  else if (m.kind === 'ambiguous') questionText = 'pode ser mais de um aluno';
  else                             questionText = 'não consegui identificar';

  const headerAction = isSaved
    ? '<span class="review-status-badge">✓ Salvo</span>'
    : '<button type="button" class="review-confirm-btn" data-confirm-btn>✓ Confirmar</button>';

  const visSel = currentDecision?.type === 'visitor' ? 'selected' : '';
  let cardHtml = `
    <div class="review-head">
      <span class="meet-chip">${escapeHtml(m.meet)}</span>
      <span class="review-question">${questionText}</span>
      ${headerAction}
    </div>
    <select aria-label="Escolher correspondência para ${escapeHtml(m.meet)}">
      <option value="__skip__">— ainda não decidi —</option>
      <option value="__visitor__" ${visSel}>👤 Não é aluno (professor, coordenador, visitante)</option>
      <option disabled>──────────</option>
  `;

  // Top candidatos em destaque
  const candIds = new Set();
  for (const c of (m.candidates || [])) {
    candIds.add(c.name);
    const sel = (currentDecision?.type === 'student' && currentDecision.studentName === c.name) ? 'selected' : '';
    cardHtml += `<option value="${escapeHtml(c.name)}" ${sel}>★ ${escapeHtml(c.name)}</option>`;
  }

  // Demais alunos ordenados
  const others = cls.students.filter(s => !candIds.has(s)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (others.length) {
    if (candIds.size) cardHtml += `<option disabled>──────────</option>`;
    for (const s of others) {
      const sel = (currentDecision?.type === 'student' && currentDecision.studentName === s) ? 'selected' : '';
      cardHtml += `<option value="${escapeHtml(s)}" ${sel}>${escapeHtml(s)}</option>`;
    }
  }

  cardHtml += `</select>`;

  // Feedback "✓ Salvo"
  let feedbackTarget = '';
  if (isSaved) {
    if (currentDecision?.type === 'student') feedbackTarget = `<strong>${escapeHtml(currentDecision.studentName)}</strong>`;
    else if (currentDecision?.type === 'visitor') feedbackTarget = '<strong>não é aluno</strong>';
  }
  cardHtml += `
    <div class="review-feedback">
      <span class="check-icon">✓</span>
      <span>Salvo. Da próxima vez identifico ${feedbackTarget} automaticamente.</span>
    </div>
  `;
  card.innerHTML = cardHtml;

  const select = card.querySelector('select');

  // Lógica de salvamento — usada tanto pelo change do select quanto pelo botão "Confirmar"
  function commitDecision(v) {
    const k = normalize(cleanName(m.meet));
    cls.aliases = cls.aliases || {};

    if (v === '__skip__') {
      decisions[m.meet] = { type: 'skip' };
      if (cls.aliases[k]) delete cls.aliases[k];
      userTouched.delete(m.meet);
      saveStore(STORE);
      toast('Decisão removida', 'info');
    } else if (v === '__visitor__') {
      decisions[m.meet] = { type: 'visitor' };
      cls.aliases[k] = '__visitor__';
      userTouched.add(m.meet);
      saveStore(STORE);
      toast(`✓ "${m.meet}" → não é aluno. Lembrado para a próxima.`, 'success');
    } else {
      decisions[m.meet] = { type: 'student', studentName: v };
      cls.aliases[k] = v;
      userTouched.add(m.meet);
      saveStore(STORE);
      toast(`✓ Aprendido: "${m.meet}" → ${v}`, 'success');
    }

    // Repaint completo, depois anima o card recém-salvo
    const willAnimate = userTouched.has(m.meet);
    repaint();
    if (willAnimate) {
      setTimeout(() => {
        const cards = document.querySelectorAll('.review-card');
        for (const cc of cards) {
          const chip = cc.querySelector('.meet-chip');
          if (chip && chip.textContent === m.meet && cc.classList.contains('saved')) {
            cc.classList.add('just-saved');
            setTimeout(() => cc.classList.remove('just-saved'), 500);
            break;
          }
        }
      }, 10);
    }
  }

  select.addEventListener('change', () => commitDecision(select.value));

  // Botão "✓ Confirmar" — para quando o palpite pré-preenchido já está correto
  // e o professor não precisa mexer no dropdown.
  const confirmBtn = card.querySelector('[data-confirm-btn]');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (select.value === '__skip__') {
        toast('Escolha um aluno na lista antes de confirmar', 'warning');
        select.focus();
        return;
      }
      commitDecision(select.value);
    });
  }

  parent.appendChild(card);
}
