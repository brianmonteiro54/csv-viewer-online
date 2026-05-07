/**
 * Histórico dos últimos 5 arquivos carregados, salvo em localStorage.
 */

import { toast } from "../ui/toast.js";

const STORAGE_KEY = "historico";
const MAX_ENTRIES = 5;

/** Adiciona um arquivo ao topo do histórico (mais recente primeiro). */
export function salvarHistorico(nomeArquivo) {
  const historico = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  historico.unshift({
    arquivo: nomeArquivo,
    data: new Date().toLocaleString("pt-BR"),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(historico.slice(0, MAX_ENTRIES)));
}

/** Mostra o histórico em um alert simples (TODO: substituir por modal). */
export function mostrarHistorico() {
  const historico = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!historico.length) {
    toast("Nenhum arquivo carregado ainda.", "info");
    return;
  }
  const lista = historico.map((h, i) => `${i + 1}. ${h.arquivo} — ${h.data}`).join("\n");
  alert("📂 Histórico de arquivos:\n\n" + lista);
}
