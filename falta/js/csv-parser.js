/**
 * Parsing do CSV exportado pela extensão "Meet Attendance" do Google Meet.
 * O formato tem algumas particularidades:
 *  - BOM no início (0xFEFF)
 *  - linhas com asteriscos são comentários/cabeçalhos
 *  - aspas duplas escapadas como ""
 *  - cabeçalho "Full Name" ou "Name"/"Nome" deve ser ignorado
 *  - linhas iniciais contêm metadados da reunião
 */

/**
 * Extrai a lista de nomes do CSV.
 * @param {string} text  Conteúdo bruto do arquivo
 * @returns {string[]}
 */
export function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const names = [];
  let headerSeen = false;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = line.match(/^"((?:[^"]|"")*)"|^([^,]*)/);
    let v = m ? (m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2]) : '';
    v = (v || '').replace(/^"|"$/g, '').trim();
    if (!v) continue;
    if (v.startsWith('*')) continue;
    if (!headerSeen && /^full\s*name$/i.test(v)) { headerSeen = true; continue; }
    if (/^name$/i.test(v) || /^nome$/i.test(v)) continue;
    names.push(v);
  }
  return names;
}

/**
 * Extrai metadados da reunião (código, data de criação, fim) das primeiras linhas.
 * @param {string} text
 * @returns {{code?: string, created?: string, ended?: string}}
 */
export function parseMeetingInfo(text) {
  const info = {};
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  for (const line of text.split(/\r?\n/).slice(0, 8)) {
    const m1 = line.match(/Meeting code:\s*([\w-]+)/i);
    if (m1) info.code = m1[1];
    const m2 = line.match(/Created on\s+([\d:\s-]+)/i);
    if (m2) info.created = m2[1].trim();
    const m3 = line.match(/Ended on\s+([\d:\s-]+)/i);
    if (m3) info.ended = m3[1].trim();
  }
  return info;
}
