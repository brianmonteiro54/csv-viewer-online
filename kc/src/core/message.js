/**
 * Geração da mensagem personalizada de e-mail para cada aluno.
 *
 * Há três variantes:
 *   1. Graduado (graduated=true)         → mensagem celebrativa
 *   2. Sem pendências mas não-graduado   → mensagem motivacional (rumo ao Cloud Practitioner)
 *   3. Padrão (com pendências)           → cobrança formatada com lista de KCs/Labs faltantes
 *
 * O template padrão pode incluir um aviso de prazo de encerramento se a
 * turma do aluno (Section) tiver uma data configurada em `config.encerramentos`.
 */

import { isKC, isLab, formatarNomeAtividade } from "./activity.js";
import { getSaudacao, formatarEncerramento } from "../utils/format.js";
import { normalizarSectionKey } from "../utils/string.js";
import { config } from "../config.js";

/**
 * Gera o corpo do e-mail apropriado para o aluno.
 * Retorna a string final (já com quebras de linha "\n") pronta para
 * ser passada a `encodeURIComponent` em deeplinks de Outlook/Gmail.
 */
export function gerarMensagem(row) {
  const saudacao = getSaudacao();

  // 1. Graduado — mensagem celebrativa.
  if (row.graduated) {
    return `${saudacao} ${row.name}, tudo bem com você?

Você concluiu todos os KCs e laboratórios da plataforma Canvas e oficializou sua graduação no curso AWS re/Start! Seu status no sistema foi atualizado para Graduated 🎓.

Que jornada! Foram vários meses de dedicação, laboratórios desafiadores e muita persistência, e você chegou até aqui.

Atenciosamente,`;
  }

  // 2. Sem pendências mas não-graduado — mensagem motivacional.
  if (!row.pendencias || row.pendencias.length === 0) {
    const primeiroNome = (row.name || "").split(" ")[0] || row.name || "aluno";
    return `${saudacao}, ${primeiroNome}.

Seu desempenho nos KCs está em ${row.kc}%, e seu desempenho nos Labs está em ${row.lab}%.

Parabéns, você concluiu todos os KCs e laboratórios disponíveis até o momento! Essa conquista reflete sua dedicação e compromisso em aproveitar ao máximo essa oportunidade.

Continue estudando e revisando os conteúdos, pois o próximo grande passo está à sua frente: a certificação Cloud Practitioner! Essa certificação é uma porta de entrada para oportunidades no mercado, e você já está na direção certa.

Lembre-se: todo o esforço investido agora é um investimento no seu futuro.`;
  }

  // 3. Padrão — listar pendências por categoria.
  const kcPendentes = row.pendencias.filter((p) => isKC(p));
  const labPendentes = row.pendencias.filter((p) => isLab(p));

  const listaKC = kcPendentes.length
    ? kcPendentes.map(formatarNomeAtividade).join("\n")
    : "Nenhum pendente";

  const listaLab = labPendentes.length
    ? labPendentes.map(formatarNomeAtividade).join("\n")
    : "Nenhum pendente";

  // Aviso de encerramento opcional (só se a turma tiver data configurada).
  // Aplica a normalização da chave para tolerar typos comuns (BRASAO ↔ BRSAO).
  const sectionLookup = normalizarSectionKey(row.section);
  const encerramentoISO =
    sectionLookup && config.encerramentos ? config.encerramentos[sectionLookup] : null;
  const avisoEncerramento = encerramentoISO
    ? `\nENCERRAMENTO NO CANVAS: ${formatarEncerramento(
        encerramentoISO
      )}, APÓS ESTE PERÍODO, NÃO SERÁ POSSÍVEL REALIZAR ENTREGAS E O ALUNO SERÁ CONSIDERADO REPROVADO.\n`
    : "";

  return `${saudacao} ${row.name}, tudo bem com você?

Segue seu desempenho atual nas atividades re/Start:

Na média em KC's você está com ${row.kc}%, e em Lab's está em ${row.lab}%.

Os KCs/Labs pendentes são:
${avisoEncerramento}
📘 KC (Knowledge Check)
${listaKC}

🧪 Lab (Laboratórios)
${listaLab}

Lembre-se:

1. Conclusão de 100% dos Laboratórios.
2. Pontuação mínima de ${config.criterioKC}% em KC's.
3. Presença mínima de 80%.

Atenciosamente,`;
}
