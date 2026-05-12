/**
 * Modais reutilizáveis: ajuda, apelidos aprendidos, confirmação destrutiva.
 * Todos renderizam em `#modalRoot` e fecham ao clicar no backdrop ou no X.
 */
import { STORE, saveStore } from './storage.js';
import { escapeHtml, toast } from './ui.js';
import { render } from './router.js';

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
