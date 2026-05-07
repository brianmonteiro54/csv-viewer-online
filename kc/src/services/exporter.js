/**
 * Exportações de arquivos: relatório CSV, mensagens em .txt e .csv.
 */

import { state } from "../state.js";
import { config } from "../config.js";
import { getStatus, STATUS_LABEL } from "../core/status.js";
import { gerarMensagem } from "../core/message.js";
import { toast } from "../ui/toast.js";

/** Helper interno: faz download de um Blob com o nome dado. */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exporta o relatório completo da turma em CSV (separado por `;`, com BOM UTF-8). */
export function exportarCSV() {
  if (!state.globalData.length) {
    toast("Nenhum dado para exportar.", "error");
    return;
  }
  const headers = ["Nome", "Email", "Total", "Lab", "KC", "Status"];
  const rows = state.globalData.map((row) => [
    row.name,
    row.email,
    row.total + "%",
    row.lab + "%",
    row.kc + "%",
    STATUS_LABEL[getStatus(row)] || "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(";"))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, "relatorio_alunos.csv");
  toast("Relatório exportado com sucesso! ✅");
}

/**
 * Exporta as mensagens de e-mail da fila (envioFila) em .txt simples,
 * com separadores entre alunos. Útil para revisão antes de enviar.
 */
export function exportarMensagens() {
  let conteudo = "";
  state.envioFila.forEach((aluno, i) => {
    conteudo += `============================================================\n`;
    conteudo += `Aluno ${i + 1}: ${aluno.name}\n`;
    conteudo += `E-mail: ${aluno.email}\n`;
    conteudo += `Assunto: ${config.assuntoEmail}\n`;
    conteudo += `============================================================\n\n`;
    conteudo += gerarMensagem(aluno);
    conteudo += "\n\n";
  });

  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8;" });
  downloadBlob(blob, `mensagens_alunos_${new Date().toISOString().slice(0, 10)}.txt`);
  toast(`${state.envioFila.length} mensagem(ns) exportada(s)! ✅`);
}

/**
 * Exporta as mensagens da fila como CSV — uma linha por aluno,
 * com Nome, Email, Assunto, Mensagem (newlines viram " | ").
 */
export function exportarMensagensCSV() {
  const headers = ["Nome", "Email", "Assunto", "Mensagem"];
  const rows = state.envioFila.map((aluno) => [
    aluno.name,
    aluno.email,
    config.assuntoEmail,
    gerarMensagem(aluno).replace(/\n/g, " | "),
  ]);
  const csv = [headers, ...rows]
    .map((r) =>
      r.map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`).join(";")
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `mensagens_alunos_${new Date().toISOString().slice(0, 10)}.csv`);
  toast("CSV de mensagens exportado! ✅");
}
