/**
 * Wrappers de clipboard com fallback para navegadores antigos.
 */

import { toast } from "../ui/toast.js";

/**
 * Copia texto para o clipboard usando a API moderna,
 * caindo no fallback `execCommand` se necessário.
 */
export function copiarParaClipboard(texto) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).catch(() => fallbackCopy(texto));
  } else {
    fallbackCopy(texto);
  }
}

/** Fallback: cria <textarea> off-screen, seleciona e roda execCommand("copy"). */
function fallbackCopy(texto) {
  const temp = document.createElement("textarea");
  temp.value = texto;
  temp.style.cssText = "position:fixed;opacity:0;";
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
}

/**
 * Copia mensagem e abre o Outlook Web em paralelo —
 * usado pelo botão 📋 em cada linha da tabela.
 */
export async function copiarEAbrirOutlook(msg, email) {
  try {
    await navigator.clipboard.writeText(msg);
    toast("Mensagem copiada! Abrindo e-mail... ✅");
  } catch {
    toast("Não foi possível copiar automaticamente.", "error");
  }
  window.open(
    `https://outlook.office.com/mail/deeplink/compose?to=${email}`,
    "_blank"
  );
}
