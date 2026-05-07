/**
 * Validação e processamento do CSV exportado do Canvas LMS.
 *
 * O fluxo é em duas etapas:
 *   1. `validateCSV(rawData, meta)` → relatório usado no preview (não muta nada)
 *   2. `processCSV(rawData)`        → produz a lista final de alunos prontos
 *
 * As duas etapas usam as mesmas regras de filtragem (alunos ignorados +
 * threshold de atividade ativa) para garantir consistência entre o preview
 * e o resultado real.
 */

import { isKC, isLab } from "./activity.js";
import { isAlunoIgnorado, isContaTesteAutomatica } from "./student.js";
import { fixEncoding } from "../utils/format.js";
import { normalize } from "../utils/string.js";
import { config } from "../config.js";

/** True se a célula tem qualquer conteúdo (não vazio). */
function celulaPreenchida(row, col) {
  const v = row[col];
  return v !== undefined && v !== null && v.toString().trim() !== "";
}

/** Conversor robusto para número (lida com vírgula decimal e células vazias). */
function toNumber(v) {
  if (v === undefined || v === null) return 0;
  const s = v.toString().trim();
  if (s === "") return 0;
  return parseFloat(s.replace(",", ".")) || 0;
}

/**
 * Valida um CSV parseado e devolve um relatório com:
 *   - errors:   problemas que IMPEDEM o processamento
 *   - warnings: avisos exibidos no preview (não bloqueiam)
 *   - info:     contadores agregados (alunos, KCs, Labs, graduados...)
 */
export function validateCSV(data, meta) {
  const errors = [];
  const warnings = [];
  const info = {};

  // Filtra a linha "Points Possible" que o Canvas adiciona.
  const dataLimpa = data.filter(
    (r) => !String(Object.values(r)[0] || "").includes("Points Possible")
  );

  // Categoriza CADA aluno auto-filtrado para um relato detalhado.
  function categorizarAuto(row) {
    if (!isContaTesteAutomatica(row)) return null;
    const email = (row["SIS Login ID"] || "").toString().trim();
    if (!email) return "semConvite";
    return "teste";
  }

  const alunosTeste = dataLimpa.filter((r) => categorizarAuto(r) === "teste");
  const alunosSemConv = dataLimpa.filter((r) => categorizarAuto(r) === "semConvite");
  const alunosManuais = dataLimpa.filter(
    (r) => !isContaTesteAutomatica(r) && isAlunoIgnorado(r)
  );
  const dataValidos = dataLimpa.filter((r) => !isAlunoIgnorado(r));

  info.totalLinhas = dataValidos.length;
  info.contasTeste = alunosTeste.length;
  info.semConviteAceito = alunosSemConv.length;
  info.ignoradosManuais = alunosManuais.length;

  if (!dataValidos.length) {
    if (alunosTeste.length || alunosSemConv.length || alunosManuais.length) {
      errors.push(
        `Todos os ${dataLimpa.length} aluno(s) foram filtrados. Verifique a lista de ignorados em ⚙️ Configurações.`
      );
    } else {
      errors.push("O arquivo não contém nenhum aluno.");
    }
    return { ok: false, errors, warnings, info };
  }

  if (alunosTeste.length) {
    const nomes = alunosTeste
      .map((r) => fixEncoding((r["Student"] || "").split(", ").reverse().join(" ")))
      .join(", ");
    warnings.push(
      `${alunosTeste.length} conta(s) de teste do Canvas detectada(s) e ignorada(s) automaticamente: ${nomes}.`
    );
  }
  if (alunosSemConv.length) {
    const nomes = alunosSemConv
      .map((r) => fixEncoding((r["Student"] || "").split(", ").reverse().join(" ")))
      .join(", ");
    warnings.push(
      `${alunosSemConv.length} aluno(s) que não aceitaram o convite do Canvas (sem e-mail e sem nenhuma atividade): ${nomes}. Filtrados automaticamente.`
    );
  }
  if (alunosManuais.length) {
    warnings.push(
      `${alunosManuais.length} aluno(s) ignorado(s) manualmente (configurável em ⚙️ Configurações).`
    );
  }

  const colunas = meta.fields || Object.keys(dataValidos[0] || {});
  info.totalColunas = colunas.length;

  if (!colunas.some((c) => c === "Student" || normalize(c) === "student")) {
    errors.push(
      'Coluna "Student" não encontrada. Verifique se exportou o CSV diretamente do Canvas.'
    );
  }
  if (!colunas.some((c) => c === "SIS Login ID" || normalize(c) === "sis login id")) {
    errors.push('Coluna "SIS Login ID" (e-mail do aluno) não encontrada.');
  }

  const kcCols = colunas.filter(isKC);
  const labCols = colunas.filter(isLab);
  info.kcCols = kcCols.length;
  info.labCols = labCols.length;

  if (kcCols.length === 0 && labCols.length === 0) {
    errors.push(
      "Nenhuma coluna de KC ou Lab detectada. As colunas devem começar com número e conter 'KC' ou 'Lab' (ex: '01-KC-Cloud Foundations')."
    );
  }

  // Auto-ajuste do threshold para turmas pequenas.
  let minEfetivo = config.minAlunos;
  if (dataValidos.length < config.minAlunos) {
    minEfetivo = Math.max(1, dataValidos.length);
    warnings.push(
      `Turma com apenas ${dataValidos.length} alunos — limite mínimo ajustado de ${config.minAlunos} para ${minEfetivo} automaticamente.`
    );
  }
  info.minEfetivo = minEfetivo;

  const kcAtivos = kcCols.filter(
    (col) => dataValidos.filter((r) => celulaPreenchida(r, col)).length >= minEfetivo
  );
  const labAtivos = labCols.filter(
    (col) => dataValidos.filter((r) => celulaPreenchida(r, col)).length >= minEfetivo
  );

  info.kcAtivos = kcAtivos.length;
  info.labAtivos = labAtivos.length;

  if (
    kcAtivos.length === 0 &&
    labAtivos.length === 0 &&
    (kcCols.length > 0 || labCols.length > 0)
  ) {
    warnings.push(
      `Nenhuma atividade preenchida por pelo menos ${minEfetivo} alunos. Reduza o limite mínimo nas configurações ⚙️.`
    );
  }

  info.graduados = dataValidos.filter(
    (r) => parseFloat((r["Graduated Final Points"] || "0").replace(",", ".")) === 1
  ).length;

  const emailsInvalidos = dataValidos.filter((r) => {
    const e = (r["SIS Login ID"] || "").trim();
    return e && !/@/.test(e);
  }).length;
  if (emailsInvalidos > 0) {
    warnings.push(
      `${emailsInvalidos} aluno(s) sem e-mail válido — o envio individual pode não funcionar para eles.`
    );
  }

  return { ok: errors.length === 0, errors, warnings, info };
}

/**
 * Processa o CSV e devolve a lista de alunos prontos para renderização.
 *
 * Cada aluno tem:
 *   { name, email, id, section, kc, lab, total, pendencias, graduated }
 *
 * Cálculo:
 *   - kc:    média aritmética dos KCs ativos (vazio = 0)
 *   - lab:   média dos Labs ativos × 100 (cada lab cap 1.0)
 *   - total: (kc + lab) / 2
 */
export function processCSV(rawData) {
  const columns = Object.keys(rawData[0] || {});
  const kcCols = columns.filter(isKC);
  const labCols = columns.filter(isLab);

  // Filtra linha "Points Possible" e alunos ignorados (auto + manual).
  let data = rawData
    .filter((r) => !String(Object.values(r)[0]).includes("Points Possible"))
    .filter((r) => !isAlunoIgnorado(r));

  // Auto-ajuste para turmas pequenas — mantém consistência com validateCSV.
  const minEfetivo =
    data.length < config.minAlunos ? Math.max(1, data.length) : config.minAlunos;

  const kcAtivos = kcCols.filter(
    (col) => data.filter((row) => celulaPreenchida(row, col)).length >= minEfetivo
  );
  const labAtivos = labCols.filter(
    (col) => data.filter((row) => celulaPreenchida(row, col)).length >= minEfetivo
  );
  const targetColumns = [...kcAtivos, ...labAtivos];

  return data.map((row) => {
    let kcSum = 0,
      kcCount = 0,
      labSum = 0,
      labCount = 0;
    const pendencias = [];

    targetColumns.forEach((col) => {
      const preenchida = celulaPreenchida(row, col);
      const val = toNumber(row[col]);
      if (isKC(col)) {
        kcCount++;
        if (!preenchida) pendencias.push(col);
        else kcSum += val;
      }
      if (isLab(col)) {
        labCount++;
        if (!preenchida) pendencias.push(col);
        else labSum += val > 1 ? 1 : val;
      }
    });

    const kc = kcCount ? kcSum / kcCount : 0;
    const lab = labCount ? (labSum / labCount) * 100 : 0;
    const total = (kc + lab) / 2;

    return {
      name: fixEncoding((row["Student"] || "").split(", ").reverse().join(" ")),
      email: (row["SIS Login ID"] || "").trim().toLowerCase(),
      id: (row["ID"] || "").toString().trim(),
      section: (row["Section"] || "").toString().trim().toUpperCase(),
      kc: kc.toFixed(2),
      lab: lab.toFixed(2),
      total: total.toFixed(2),
      pendencias,
      graduated: toNumber(row["Graduated Final Points"]) === 1,
    };
  });
}
