/**
 * Área de cópia em massa: cola lista de e-mails → recebe Total/Lab/KC
 * na mesma ordem, em formato pronto para colar em planilha.
 */

import { byId } from "../utils/dom.js";
import { state } from "../state.js";
import { copiarParaClipboard } from "../services/clipboard.js";
import { toast } from "./toast.js";

/** Mostra/esconde a área de cópia em massa. */
export function mostrarAreaCopia() {
  const area = byId("area-copia");
  if (!area) return;
  area.hidden = !area.hidden;
  if (!area.hidden) {
    area.scrollIntoView({ behavior: "smooth", block: "nearest" });
    byId("lista-emails").focus();
  }
}

/**
 * Lê os e-mails colados no <textarea>, monta uma string TSV (Total\tLab\tKC)
 * na mesma ordem, e copia para o clipboard.
 *
 * E-mails não encontrados aparecem como "email não corresponde..." e são
 * logados no console para o usuário poder revisar.
 */
export function copiarDesempenhoOrdenado() {
  const input = byId("lista-emails").value;
  const emails = input
    .split("\n")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e);

  if (!emails.length) {
    toast("Cole ao menos um e-mail.", "warning");
    return;
  }

  let resultado = "";
  let encontrados = 0;
  const naoEncontrados = [];

  emails.forEach((email) => {
    const aluno = state.globalData.find(
      (a) => (a.email || "").trim().toLowerCase() === email
    );
    if (aluno) {
      encontrados++;
      const total = parseFloat(aluno.total).toFixed(1).replace(".", ",") + "%";
      const lab = parseFloat(aluno.lab).toFixed(1).replace(".", ",") + "%";
      const kc = parseFloat(aluno.kc).toFixed(1).replace(".", ",") + "%";
      resultado += `${total}\t${lab}\t${kc}\n`;
    } else {
      naoEncontrados.push(email);
      resultado += `email não corresponde ao cadastrado no canvas\t\t\n`;
    }
  });

  copiarParaClipboard(resultado.trim());

  if (naoEncontrados.length > 0) {
    console.warn("E-mails não encontrados:", naoEncontrados);
    toast(
      `⚠️ ${naoEncontrados.length} e-mail(s) não encontrado(s). Veja o console (F12).`,
      "warning"
    );
  } else {
    toast(`Desempenho copiado! ${encontrados} aluno(s) encontrado(s). ✅`);
  }
}
