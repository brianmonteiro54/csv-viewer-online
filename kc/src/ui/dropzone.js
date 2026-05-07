/**
 * Drag & drop + clique para selecionar arquivo CSV.
 *
 * O fluxo é:
 *   1. Usuário arrasta ou clica → `receberArquivo(file)`
 *   2. Validação inicial (extensão, tamanho)
 *   3. PapaParse para parse rápido
 *   4. `validateCSV()` (módulo core) gera relatório
 *   5. `mostrarPreview()` (módulo preview) exibe o relatório
 *
 * O CSV NÃO é processado de fato até o usuário clicar em "Confirmar".
 */

import { byId, $ } from "../utils/dom.js";
import { state } from "../state.js";
import { formatBytes } from "../utils/format.js";
import { validateCSV } from "../core/csv.js";
import { mostrarProgresso, esconderProgresso } from "./progress.js";
import { mostrarPreview } from "./preview.js";
import { toast } from "./toast.js";

/** Limite de 10MB para evitar parse de arquivos absurdos. */
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Conecta os listeners de drag/drop e click no elemento #dropzone.
 * Deve ser chamada uma vez no boot.
 */
export function configurarDropzone() {
  const dropzone = byId("dropzone");
  const fileInput = byId("fileInput");
  if (!dropzone || !fileInput) return;

  // Click ou Enter/Space no dropzone abre o seletor.
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  // Visual feedback durante drag.
  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });

  // Drop → recebe o arquivo.
  dropzone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length) receberArquivo(files[0]);
  });

  // File input change → mesmo tratamento.
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) receberArquivo(fileInput.files[0]);
  });
}

/**
 * Valida e parseia o arquivo, depois exibe o preview.
 * Não muta `state.globalData` ainda — isso só acontece em `confirmarProcessamento`.
 */
export function receberArquivo(file) {
  if (!file) return;

  // Validações iniciais (antes do parse).
  if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
    toast(`"${file.name}" não parece ser um CSV.`, "error");
    return;
  }
  if (file.size === 0) {
    toast("Arquivo vazio.", "error");
    return;
  }
  if (file.size > MAX_BYTES) {
    toast("Arquivo muito grande (máx. 10MB).", "error");
    return;
  }

  state.pendingFile = file;
  $("#dropzone-file").textContent = `📄 ${file.name} (${formatBytes(file.size)})`;

  const status = byId("status");
  if (status) status.innerText = "Validando arquivo...";
  mostrarProgresso(40);

  // PapaParse é carregado via <script> CDN no index.html (window.Papa).
  window.Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      mostrarProgresso(80);
      const validation = validateCSV(results.data, results.meta);
      mostrarProgresso(100);
      esconderProgresso();
      if (status) status.innerText = "";

      state.pendingPreview = {
        rawData: results.data,
        meta: results.meta,
        validation,
      };
      mostrarPreview(validation);
    },
    error: (err) => {
      esconderProgresso();
      if (status) status.innerText = "";
      toast("Erro ao ler o arquivo: " + (err?.message || "desconhecido"), "error");
      state.pendingFile = null;
    },
  });
}
