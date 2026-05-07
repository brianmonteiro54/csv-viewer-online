/**
 * Datas de encerramento por turma.
 *
 * Cada `Section` (BRSAOXXX, BRRJ301...) pode ter uma data/hora limite.
 * Quando configurada, a mensagem de e-mail dos alunos NÃO-graduados dessa
 * turma inclui um aviso adicional.
 *
 * Persistência: `config.encerramentos` (objeto Section → ISO datetime).
 */

import { config, saveConfig } from "../config.js";
import { normalizarSectionKey } from "../utils/string.js";
import { formatarEncerramento } from "../utils/format.js";
import { toast } from "../ui/toast.js";

/**
 * Adiciona/atualiza a data de encerramento de uma turma.
 *
 * Faz normalização da chave (BRASAO → BRSAO) e pede confirmação ao
 * usuário se detectar correção automática.
 *
 * @returns {boolean} true se a data foi salva
 */
export function adicionarEncerramento(sectionDigitada, dataISO) {
  const sectionUpper = (sectionDigitada || "").trim().toUpperCase();
  const section = normalizarSectionKey(sectionUpper);
  const data = (dataISO || "").trim();

  if (!section) {
    toast("Informe o código da turma (ex: BRSAOXXX).", "error");
    return false;
  }
  if (!data) {
    toast("Informe a data e hora de encerramento.", "error");
    return false;
  }

  // Avisa se houve correção de typo comum.
  if (sectionUpper !== section) {
    const ok = confirm(
      `Detectado typo comum: "${sectionUpper}" → "${section}".\n\n` +
        `O Canvas usa "BR" e não "BRA" no prefixo. Salvar como "${section}"?`
    );
    if (!ok) return false;
  }

  config.encerramentos[section] = data;
  saveConfig();
  toast(
    `Encerramento da turma ${section} configurado para ${formatarEncerramento(data)} ✅`
  );
  return true;
}

/**
 * Remove a data de encerramento de uma turma (com confirmação).
 *
 * @returns {boolean} true se foi removida
 */
export function removerEncerramento(section) {
  if (!confirm(`Remover a data de encerramento da turma "${section}"?`)) {
    return false;
  }
  delete config.encerramentos[section];
  saveConfig();
  toast(`Encerramento da turma ${section} removido.`, "info");
  return true;
}
