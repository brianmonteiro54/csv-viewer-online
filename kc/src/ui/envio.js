/**
 * Modal de Envio em Massa.
 *
 * Apresenta 3 abas:
 *   1. Individual — abre os e-mails um por um (contorna bloqueio de pop-ups)
 *   2. Lista      — copia todos os e-mails separados por ";"
 *   3. Exportar   — baixa as mensagens em .txt ou .csv
 *
 * O modal é populado a partir de um filtro de status (red/yellow/...) e
 * mantém uma fila (`state.envioFila`) com o progresso.
 */

import { byId, $, $$ } from "../utils/dom.js";
import { state } from "../state.js";
import { config } from "../config.js";
import { getStatus } from "../core/status.js";
import { gerarMensagem } from "../core/message.js";
import { copiarParaClipboard } from "../services/clipboard.js";
import { abrirModal } from "./modal.js";
import { toast } from "./toast.js";

const STATUS_LABEL_MASSA = {
  red: "Críticos 🔴",
  yellow: "Atenção 🟡",
  green: "OK 🟢",
  graduated: "Graduados 🎓",
};

/**
 * Abre o modal carregando a fila com os alunos do status pedido.
 * Se não houver alunos nesse status, dispara um toast e não abre.
 */
export function abrirEnvioMassa(status) {
  const alunos = state.globalData.filter((r) => getStatus(r) === status);
  if (!alunos.length) {
    toast("Nenhum aluno nesse status.", "info");
    return;
  }

  state.envioFila = alunos;
  state.envioIndex = 0;

  byId("envio-info").innerHTML =
    `Preparando e-mails para <strong>${alunos.length} aluno(s)</strong> com status <strong>${STATUS_LABEL_MASSA[status]}</strong>.`;

  // Lista interativa (aba "Individual").
  const listaEl = byId("envio-lista");
  listaEl.innerHTML = "";
  alunos.forEach((aluno, idx) => {
    const item = document.createElement("div");
    item.className = "envio-item";
    item.dataset.idx = idx;
    item.innerHTML = `
      <div class="envio-item-info">
        <div class="envio-item-name">${aluno.name}</div>
        <div class="envio-item-email">${aluno.email}</div>
      </div>
      <button class="envio-item-action btn-primary" data-action="abrir-email-individual" data-idx="${idx}">
        ✉️ Abrir
      </button>
    `;
    listaEl.appendChild(item);
  });

  // Lista textual (aba "Lista") — separada por ";" para colar em Cco.
  byId("lista-emails-massa").value = alunos.map((a) => a.email).join("; ");

  atualizarProgressoEnvio();
  abrirModal("modal-envio");
  trocarAbaEnvio("individual");
}

/** Abre o e-mail do aluno na posição `idx` da fila no Outlook Web. */
export function abrirEmailIndividual(idx) {
  const aluno = state.envioFila[idx];
  if (!aluno) return;
  const msg = gerarMensagem(aluno);
  const assunto = config.assuntoEmail;

  window.open(
    `https://outlook.office.com/mail/deeplink/compose?to=${aluno.email}` +
      `&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(msg)}`,
    "_blank"
  );

  // Marca como aberto.
  const item = $(`.envio-item[data-idx="${idx}"]`);
  if (item) {
    item.classList.add("sent");
    const btn = $("button", item);
    btn.innerHTML = "✅ Aberto";
  }

  state.envioIndex = Math.max(state.envioIndex, idx + 1);
  atualizarProgressoEnvio();
}

/** Abre o próximo e-mail da fila (botão "▶️ Abrir próximo"). */
export function abrirProximoEmail() {
  if (state.envioIndex >= state.envioFila.length) {
    toast("Todos os e-mails foram abertos! ✅");
    return;
  }
  abrirEmailIndividual(state.envioIndex);
}

/** Atualiza o texto e o estado do botão de progresso. */
function atualizarProgressoEnvio() {
  const enviados = $$(".envio-item.sent").length;
  const total = state.envioFila.length;
  byId("envio-progress-text").innerText = `${enviados} de ${total} e-mails abertos`;

  const btnProximo = byId("btn-proximo-email");
  if (enviados >= total) {
    btnProximo.innerText = "✅ Todos abertos";
    btnProximo.disabled = true;
  } else {
    btnProximo.innerText = "▶️ Abrir próximo";
    btnProximo.disabled = false;
  }
}

/** Troca de aba no modal de envio. */
export function trocarAbaEnvio(aba) {
  $$(".envio-tab").forEach((t) => {
    const ativa = t.dataset.tab === aba;
    t.classList.toggle("active", ativa);
    t.setAttribute("aria-selected", ativa ? "true" : "false");
  });
  $$(".envio-tab-content").forEach((c) => {
    c.classList.toggle("active", c.id === `envio-tab-${aba}`);
  });
}

/** Copia a lista textual de e-mails (aba "Lista"). */
export function copiarListaEmails() {
  const texto = byId("lista-emails-massa").value;
  copiarParaClipboard(texto);
  toast("Lista de e-mails copiada! ✅");
}
