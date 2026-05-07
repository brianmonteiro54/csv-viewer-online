/**
 * Helpers de formatação — datas, bytes, encoding, saudações.
 * Funções puras (sem efeitos colaterais).
 */

/**
 * Corrige strings com problema de encoding (UTF-8 lido como Latin-1).
 * Caso o decode falhe, devolve a string original.
 */
export function fixEncoding(str) {
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
}

/** Formata bytes em KB/MB com 1 casa decimal. */
export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/** Retorna a saudação adequada ao horário ("Bom dia", "Boa tarde", "Boa noite"). */
export function getSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * Formata um datetime ISO local (ex: "2026-05-20T23:59")
 * em texto BR ("20/05/2026 Às 23:59").
 */
export function formatarEncerramento(iso) {
  if (!iso) return "";
  const [date, time] = iso.split("T");
  if (!date) return "";
  const [y, m, d] = date.split("-");
  const [h, min] = (time || "23:59").split(":");
  return `${d}/${m}/${y} Às ${h}:${min}`;
}

/**
 * Formata o `quando` (ISO 8601 ou número em ms) registrado
 * quando um aluno foi adicionado à lista de ignorados.
 */
export function formatarDataIgnorado(quando) {
  if (!quando) return "";
  const d = new Date(quando);
  if (isNaN(d.getTime())) return "";
  const dia = d.toLocaleDateString("pt-BR");
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} ${hora}`;
}
