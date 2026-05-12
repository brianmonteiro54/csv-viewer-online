/**
 * O "cérebro" da ferramenta — algoritmo de matching entre nomes
 * do Meet (parciais, com typos, concatenados…) e a lista oficial da turma.
 *
 * Funciona em camadas:
 *   1. Normalização (sem acentos, lowercase, remove parênteses/sufixos)
 *   2. Tokenização (palavras significativas, sem stopwords)
 *   3. Similaridade entre tokens (igualdade, prefixo, contém, Levenshtein)
 *   4. Score agregado por candidato + classificação (confident/likely/ambiguous/no_match)
 *   5. Aliases aprendidos têm prioridade total
 */

const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du']);
const INSTRUCTOR_RE = /\b(instrutor|instrutora|professor|professora|coordenador|coordenadora|edn|fireflies|notetaker|bot|monitor|monitora)\b/i;

/** Remove acentos, lowercase, trim. */
export function normalize(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Limpa um nome bruto vindo do Meet:
 * - remove `(apelido)` em parênteses
 * - corta sufixos tipo " - Instrutor EdN"
 * - tira pontos e espaços extras
 */
export function cleanName(raw) {
  let s = (raw || '').replace(/\([^)]*\)/g, ' ');
  s = s.replace(/\s+-\s+.*$/, '');
  s = s.replace(/\./g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/** Divide em tokens significativos (sem stopwords). */
function tokenize(name) {
  const cleaned = normalize(cleanName(name));
  if (!cleaned) return [];
  return cleaned.split(/\s+/).filter(t => t && !STOPWORDS.has(t));
}

/** Detecta visitantes/bots/instrutores pelo nome. */
function detectInstructor(name) { return INSTRUCTOR_RE.test(name || ''); }

/** Distância de edição clássica (Wagner-Fischer com 2 linhas). */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (a.length < b.length) { const t = a; a = b; b = t; }
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const cur = [i + 1];
    for (let j = 0; j < b.length; j++) {
      cur.push(Math.min(prev[j + 1] + 1, cur[j] + 1, prev[j] + (a[i] === b[j] ? 0 : 1)));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Similaridade entre 2 tokens, retorna valor entre 0 e 1:
 * - 1.0  : idênticos
 * - 0.92 : um é prefixo do outro (≥3 chars)
 * - 0.85 : um contém o outro (≥4 chars)
 * - 0.88 : distância Levenshtein ≤ 1 (typo simples)
 * - 0    : sem match
 */
function tokenSim(a, b) {
  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) return 0;
  if (a.length >= 3 && b.length >= 3) {
    if (a.startsWith(b) || b.startsWith(a)) return 0.92;
  }
  if (a.length >= 4 && b.length >= 4) {
    if (a.includes(b) || b.includes(a)) return 0.85;
  }
  if (a.length >= 5 && b.length >= 5 && Math.abs(a.length - b.length) <= 1) {
    if (levenshtein(a, b) <= 1) return 0.88;
  }
  return 0;
}

/**
 * Pontua um candidato (estudante) contra os tokens do Meet.
 * Trata o caso especial de tokens concatenados (ex: "joaoventura" = 2 tokens grudados).
 */
function scoreStudent(meetTokens, studentTokens) {
  if (!meetTokens.length || !studentTokens.length) {
    return { score: 0, coverage: 0, exact: 0, matched: 0 };
  }
  let totalSim = 0, exact = 0, matched = 0;
  const used = new Set();

  for (const mt of meetTokens) {
    // Caso "concatenado": token grande pode conter 2+ tokens do estudante
    if (mt.length >= 6) {
      const contained = [];
      for (let i = 0; i < studentTokens.length; i++) {
        if (used.has(i)) continue;
        const st = studentTokens[i];
        if (st.length >= 4 && st !== mt && mt.includes(st)) contained.push({ i, st });
      }
      if (contained.length >= 2) {
        contained.sort((a, b) => b.st.length - a.st.length);
        let remaining = mt;
        for (const { i, st } of contained) {
          if (remaining.includes(st)) {
            used.add(i);
            totalSim += 0.9;
            matched++;
            remaining = remaining.replace(st, '');
          }
        }
        continue;
      }
    }
    // Caso normal: melhor match individual
    let bestSim = 0, bestI = -1;
    for (let i = 0; i < studentTokens.length; i++) {
      if (used.has(i)) continue;
      const sim = tokenSim(mt, studentTokens[i]);
      if (sim > bestSim) { bestSim = sim; bestI = i; }
    }
    if (bestSim > 0) {
      totalSim += bestSim;
      matched++;
      if (bestSim >= 0.999) exact++;
      if (bestI >= 0) used.add(bestI);
    }
  }
  return { score: totalSim, coverage: matched / meetTokens.length, exact, matched };
}

/**
 * Match principal: dado um nome do Meet, retorna a melhor classificação.
 *
 * @param {string} meetName        Nome bruto vindo do CSV
 * @param {string[]} students      Lista oficial da turma
 * @param {Record<string,string>} aliases  Apelidos aprendidos (chave normalizada → estudante ou "__visitor__")
 * @returns {{kind: 'confident'|'likely'|'ambiguous'|'no_match'|'instructor'|'visitor', meet: string, top: ?string, candidates: Array, fromAlias?: boolean}}
 */
export function matchOne(meetName, students, aliases) {
  // 1. Detecção automática de visitantes/instrutores/bots
  if (detectInstructor(meetName)) {
    return { kind: 'instructor', meet: meetName, top: null, candidates: [] };
  }

  // 2. Aliases aprendidos têm prioridade absoluta
  const key = normalize(cleanName(meetName));
  if (aliases && Object.prototype.hasOwnProperty.call(aliases, key)) {
    const aliased = aliases[key];
    if (aliased === '__visitor__') {
      return { kind: 'visitor', meet: meetName, top: null, candidates: [], fromAlias: true };
    }
    const idx = students.findIndex(s => normalize(s) === normalize(aliased));
    if (idx >= 0) {
      return {
        kind: 'confident',
        meet: meetName,
        top: students[idx],
        topIdx: idx,
        candidates: [{ name: students[idx], score: 99 }],
        fromAlias: true
      };
    }
  }

  // 3. Match algorítmico
  const meetTokens = tokenize(meetName);
  if (!meetTokens.length) return { kind: 'no_match', meet: meetName, top: null, candidates: [] };

  const scored = [];
  for (let i = 0; i < students.length; i++) {
    const r = scoreStudent(meetTokens, tokenize(students[i]));
    if (r.score > 0) scored.push({ i, r });
  }
  scored.sort((a, b) => b.r.score - a.r.score);
  if (!scored.length) return { kind: 'no_match', meet: meetName, top: null, candidates: [] };

  const top = scored[0], runner = scored[1];
  const topAllExact = top.r.exact === meetTokens.length && top.r.coverage >= 0.999;
  const runnerAllExact = runner && runner.r.exact === meetTokens.length && runner.r.coverage >= 0.999;
  const runnerScore = runner ? runner.r.score : 0;

  // Classificação final
  let kind;
  if (topAllExact && !runnerAllExact) kind = 'confident';
  else if (top.r.coverage >= 0.5 && (top.r.score - runnerScore) >= 0.5) kind = 'likely';
  else kind = 'ambiguous';

  return {
    kind,
    meet: meetName,
    top: students[top.i],
    topIdx: top.i,
    topScore: top.r.score,
    candidates: scored.slice(0, 5).map(s => ({
      name: students[s.i], score: s.r.score, coverage: s.r.coverage
    }))
  };
}
