/**
 * Modais reutilizáveis: ajuda, apelidos aprendidos, confirmação destrutiva.
 * Todos renderizam em `#modalRoot` e fecham ao clicar no backdrop ou no X.
 */
import { STORE, saveStore } from './storage.js';
import { escapeHtml, toast } from './ui.js';
import { render } from './router.js';
import {
  TEMPLATE_PLACEHOLDERS,
  DEFAULT_SUBJECT_TEMPLATE,
  DEFAULT_BODY_TEMPLATE,
  getEmailTemplate,
  applyTemplate,
  capitalizeWords
} from './email-helper.js';

/** Helper para fechar qualquer modal (limpa o root). */
function closeModalRoot() {
  const root = document.getElementById('modalRoot');
  if (root) root.innerHTML = '';
}

/** Conecta os listeners de fechamento (botão X e clique no backdrop). */
function bindModalClose(onClose) {
  const finalClose = onClose || closeModalRoot;
  document.getElementById('closeModal').onclick = finalClose;
  const backdrop = document.getElementById('modalBackdrop');
  backdrop.onclick = (e) => { if (e.target.id === 'modalBackdrop') finalClose(); };
}

/**
 * Modal de visualização e remoção de apelidos aprendidos para uma turma.
 * @param {object} cls
 */
export function openAliasesModal(cls) {
  const root = document.getElementById('modalRoot');
  const aliases = cls.aliases || {};
  const entries = Object.entries(aliases).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));

  let body = '';
  if (!entries.length) {
    body = '<p style="color: var(--text-muted); font-style: italic; text-align: center; padding: 20px;">Nenhum apelido aprendido ainda.</p>';
  } else {
    body = '<p style="font-size: 13px; color: var(--text-muted); margin: 0 0 14px;">Conforme você confirma identificações, a ferramenta aprende e reconhece automaticamente da próxima vez.</p>';
    body += '<div class="list">';
    for (const [meet, target] of entries) {
      const label = target === '__visitor__'
        ? '<span style="color: var(--text-muted)">→ visitante</span>'
        : `→ <strong>${escapeHtml(target)}</strong>`;
      body += `
        <div class="row">
          <div class="name">
            <code style="background: var(--bg-subtle); padding: 2px 6px; border-radius: 4px; font-size: 12.5px;">${escapeHtml(meet)}</code>
            <div style="font-size: 13px; margin-top: 4px;">${label}</div>
          </div>
          <button class="btn-ghost btn-sm" data-rm="${escapeHtml(meet)}">Esquecer</button>
        </div>
      `;
    }
    body += '</div>';
  }

  root.innerHTML = `
    <div class="modal" id="modalBackdrop">
      <div class="modal-content">
        <div class="modal-header">
          <h2>🧠 Apelidos aprendidos</h2>
          <button class="modal-close" id="closeModal">✕</button>
        </div>
        <div class="modal-body">${body}</div>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-rm]').forEach(b => {
    b.onclick = () => {
      const k = b.dataset.rm;
      delete cls.aliases[k];
      saveStore(STORE);
      toast('Apelido esquecido', 'info');
      openAliasesModal(cls); // re-render do modal
    };
  });

  // Ao fechar, re-render da view (pra atualizar contador de apelidos no header)
  bindModalClose(() => { closeModalRoot(); render(); });
}

/** Modal de ajuda — explica como funciona o reconhecimento. */
export function openHelpModal() {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal" id="modalBackdrop">
      <div class="modal-content">
        <div class="modal-header">
          <h2>❓ Como funciona</h2>
          <button class="modal-close" id="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-top:0"><strong>1. Crie a turma uma vez</strong> colando a lista de alunos.</p>
          <p><strong>2. Faça upload do CSV</strong> exportado pela extensão Meet Attendance.</p>
          <p><strong>3. Confira o resultado.</strong> O sistema reconhece automaticamente:</p>
          <ul style="font-size: 14px; line-height: 1.7;">
            <li>Primeiro nome só: <code>"Fulano"</code> → <code>"Fulano de Tal Silva"</code></li>
            <li>Sobrenome só: <code>"Beltrano Santos"</code> → <code>"Ciclano Beltrano Santos"</code></li>
            <li>Acentuação/maiúsculas: <code>"NOME SOBRENOME"</code> → <code>"Nome Sobrenome"</code></li>
            <li>Typos: <code>"Fulannoo Silvaa"</code> → <code>"Fulano Silva"</code></li>
            <li>Concatenados: <code>"fulanodesilva"</code> → <code>"FULANO DE SILVA"</code></li>
            <li>Instrutores e bots são detectados automaticamente</li>
          </ul>
          <p><strong>4. Confirme casos ambíguos.</strong> Quando você escolhe um nome, a ferramenta <strong>aprende</strong> — e da próxima aula reconhece sem perguntar.</p>
          <p style="background: var(--success-soft); padding: 10px 14px; border-radius: 8px; font-size: 13.5px;">
            📧 <strong>Modo com e-mails (opcional):</strong> ao criar a turma, ative o toggle para colar
            <code>Nome &nbsp;TAB&nbsp; email@dominio.com</code> em cada linha. Depois, na tela de resultado,
            cada aluno que faltou ganha um botão <strong>“Enviar e-mail”</strong> que abre o Outlook
            já com a mensagem pronta.
          </p>
          <p style="background: var(--primary-soft); padding: 10px 14px; border-radius: 8px; font-size: 13.5px;">
            🧠 <strong>Tudo é salvo no seu navegador.</strong> Para usar em outro computador, recrie a turma lá.
          </p>
        </div>
      </div>
    </div>
  `;
  bindModalClose();
}

/**
 * Modal de confirmação destrutiva (ex: apagar turma).
 * @param {string} title
 * @param {string} message
 * @param {() => void} onYes  Callback executado ao confirmar.
 */
export function openConfirm(title, message, onYes) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal" id="modalBackdrop">
      <div class="modal-content" style="max-width: 460px;">
        <div class="modal-header">
          <h2>${escapeHtml(title)}</h2>
          <button class="modal-close" id="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <p style="margin: 0; color: var(--text-muted);">${escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" id="noBtn">Cancelar</button>
          <button class="btn-danger" id="yesBtn">Sim, apagar</button>
        </div>
      </div>
    </div>
  `;
  const close = closeModalRoot;
  document.getElementById('closeModal').onclick = close;
  document.getElementById('noBtn').onclick = close;
  document.getElementById('yesBtn').onclick = () => { close(); onYes(); };
  document.getElementById('modalBackdrop').onclick = (e) => {
    if (e.target.id === 'modalBackdrop') close();
  };
}

/**
 * Modal de configuração do template de e-mail.
 * Permite editar o ASSUNTO e a MENSAGEM usados pelo botão "📧 Enviar e-mail".
 * O template é salvo em STORE.emailTemplate (localStorage).
 *
 * Recursos:
 *  - Chips clicáveis com os placeholders disponíveis ({nome}, {data} etc).
 *    Clicar insere o placeholder na posição do cursor do campo focado.
 *  - "Restaurar padrão" volta o template ao texto original.
 *  - Preview mostra o resultado final substituindo os placeholders por um
 *    aluno-exemplo.
 */
export function openEmailSettingsModal() {
  const root = document.getElementById('modalRoot');
  const current = getEmailTemplate();
  // Estado local (não persiste até o usuário clicar Salvar)
  let subject = current.subject;
  let body = current.body;
  // Qual campo o usuário tocou por último (pra inserção de placeholder)
  let lastFocused = 'body';

  function paint() {
    // Preview com aluno-exemplo
    const today = new Date();
    const sampleVars = {
      nome:          'Brian Richard Ribeiro Monteiro',
      primeiro_nome: 'Brian',
      data:          today.toLocaleDateString('pt-BR'),
      saudacao:      today.getHours() >= 18 ? 'Boa noite'
                    : today.getHours() >= 12 ? 'Boa tarde' : 'Bom dia'
    };
    const previewSubject = applyTemplate(subject, sampleVars);
    const previewBody = applyTemplate(body, sampleVars);

    const placeholdersHtml = TEMPLATE_PLACEHOLDERS.map(p => `
      <button type="button" class="placeholder-chip" data-placeholder="${escapeHtml(p.key)}" title="${escapeHtml(p.desc)}">
        <code>${escapeHtml(p.key)}</code>
        <span class="placeholder-chip-desc">${escapeHtml(p.desc)}</span>
      </button>
    `).join('');

    root.innerHTML = `
      <div class="modal" id="modalBackdrop">
        <div class="modal-content email-settings-modal">
          <div class="modal-header">
            <h2>⚙️ Configurar mensagem de e-mail</h2>
            <button class="modal-close" id="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin: 0 0 12px; font-size: 13.5px; color: var(--text-muted);">
              O botão <strong>📧 Enviar e-mail</strong> nos resultados usará este template.
              Clique num marcador abaixo para inserir no campo onde está o cursor.
            </p>

            <div class="placeholder-chips" id="placeholderChips">${placeholdersHtml}</div>

            <div class="field">
              <label for="tmplSubject">Assunto</label>
              <input type="text" id="tmplSubject" value="${escapeHtml(subject)}" spellcheck="false">
            </div>

            <div class="field">
              <label for="tmplBody">Mensagem</label>
              <textarea id="tmplBody" spellcheck="false" style="min-height: 260px;">${escapeHtml(body)}</textarea>
            </div>

            <details class="email-preview">
              <summary>👁 Pré-visualizar com aluno-exemplo</summary>
              <div class="email-preview-content">
                <div><strong>Assunto:</strong> ${escapeHtml(previewSubject)}</div>
                <pre>${escapeHtml(previewBody)}</pre>
              </div>
            </details>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" id="resetBtn" style="margin-right: auto;">🔄 Restaurar padrão</button>
            <button class="btn-ghost" id="cancelBtn">Cancelar</button>
            <button class="btn-primary" id="saveBtn">💾 Salvar</button>
          </div>
        </div>
      </div>
    `;

    const close = closeModalRoot;
    document.getElementById('closeModal').onclick = close;
    document.getElementById('cancelBtn').onclick = close;
    document.getElementById('modalBackdrop').onclick = (e) => {
      if (e.target.id === 'modalBackdrop') close();
    };

    const subjectInput = document.getElementById('tmplSubject');
    const bodyTextarea = document.getElementById('tmplBody');

    // Mantém o estado local sincronizado com o que o usuário digita
    subjectInput.addEventListener('input', () => { subject = subjectInput.value; });
    bodyTextarea.addEventListener('input', () => { body = bodyTextarea.value; });

    // Rastreia qual campo foi tocado por último (pra inserção via chip)
    subjectInput.addEventListener('focus', () => { lastFocused = 'subject'; });
    bodyTextarea.addEventListener('focus', () => { lastFocused = 'body'; });

    // Chips de placeholder — inserem o texto na posição do cursor
    document.querySelectorAll('.placeholder-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.dataset.placeholder;
        const target = lastFocused === 'subject' ? subjectInput : bodyTextarea;
        const start = target.selectionStart ?? target.value.length;
        const end = target.selectionEnd ?? target.value.length;
        const before = target.value.slice(0, start);
        const after = target.value.slice(end);
        target.value = before + text + after;
        // Atualiza o estado local
        if (lastFocused === 'subject') subject = target.value;
        else body = target.value;
        // Move o cursor pra depois do texto inserido
        const newPos = start + text.length;
        target.focus();
        target.setSelectionRange(newPos, newPos);
        // Re-renderiza para atualizar o preview
        paint();
      });
    });

    // Mantém o details aberto se já estava aberto antes do repaint
    // (chip click → paint → state perdido). Pequeno bônus: tentar restaurar
    // o foco no campo que estava ativo, depois do repaint.
    setTimeout(() => {
      const target = lastFocused === 'subject'
        ? document.getElementById('tmplSubject')
        : document.getElementById('tmplBody');
      if (target && document.activeElement !== target) {
        // Não força foco se algo já está focado — evita "ladroar" o foco do chip
      }
    }, 0);

    document.getElementById('resetBtn').onclick = () => {
      subject = DEFAULT_SUBJECT_TEMPLATE;
      body = DEFAULT_BODY_TEMPLATE;
      paint();
      toast('Template restaurado para o padrão (não esquece de Salvar)', 'info');
    };

    document.getElementById('saveBtn').onclick = () => {
      if (!subject.trim()) { toast('O assunto não pode ficar vazio', 'warning'); return; }
      if (!body.trim())    { toast('A mensagem não pode ficar vazia', 'warning'); return; }
      STORE.emailTemplate = { subject, body };
      saveStore(STORE);
      close();
      toast('Template de e-mail salvo', 'success');
    };
  }

  paint();
}

