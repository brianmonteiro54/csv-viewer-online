/**
 * Helper para envio de e-mail aos alunos faltosos.
 *
 * Gera um deeplink do Outlook compose pré-preenchido com assunto, corpo e CC.
 * O assunto e o corpo são templates configuráveis pelo usuário no modal de
 * configuração (botão ⚙️). Se nenhum template tiver sido salvo, usa os
 * defaults definidos aqui (compatíveis com a versão antiga, brasao180).
 *
 * Placeholders aceitos nos templates (substituídos no momento do envio):
 *   {nome}            — Nome completo do aluno (capitalizado)
 *   {primeiro_nome}   — Apenas o primeiro nome (capitalizado)
 *   {data}            — Data de hoje no formato dd/mm/aaaa
 *   {saudacao}        — "Bom dia" / "Boa tarde" / "Boa noite" pela hora local
 */
import { STORE } from './storage.js';

/** Lista de placeholders aceitos — exportada pra UI do modal de config. */
export const TEMPLATE_PLACEHOLDERS = [
  { key: '{nome}',          desc: 'Nome completo do aluno' },
  { key: '{primeiro_nome}', desc: 'Apenas o primeiro nome' },
  { key: '{data}',          desc: 'Data de hoje (dd/mm/aaaa)' },
  { key: '{saudacao}',      desc: 'Bom dia / Boa tarde / Boa noite' }
];

export const DEFAULT_SUBJECT_TEMPLATE =
  'Desempenho e Faltas - Aviso importante!! - {data} - {nome}';

export const DEFAULT_BODY_TEMPLATE =
`{saudacao}, {primeiro_nome}! Notei que faltou na aula de hoje, {data}. Está tudo bem? Caso tenha enfrentado alguma dificuldade para acessar a aula, me avise para que possamos ajudar.

⚠️ Atenção ao limite de faltas permitidas no curso:

Módulo AWS re/Start (Técnica + CP): Máximo de 04 faltas ao todo.

📜 Justificativas aceitas para análise:
✔ Atestado médico ou odontológico (seu ou de dependentes menores de 16 anos)
✔ Internação hospitalar
✔ Óbito de familiar próximo (até 8 dias consecutivos)
✔ Licença paternidade (até 5 dias)
✔ Casamento (até 8 dias)
✔ Trabalho esporádico com comprovação da empresa
✔ Motivos religiosos (com documento assinado pela instituição religiosa)

🛑 Atenção: Nem todas as justificativas serão aceitas para abono da falta. Documentos rasurados ou fora do prazo não serão aceitos.
`;

/**
 * Capitaliza cada palavra: "BRIAN RICHARD" → "Brian Richard".
 * Usado pro nome no template.
 */
export function capitalizeWords(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Saudação baseada na hora local. */
function greetingFor(date) {
  const h = date.getHours();
  if (h >= 18) return 'Boa noite';
  if (h >= 12) return 'Boa tarde';
  return 'Bom dia';
}

/**
 * Substitui placeholders no template pelos valores em `vars`.
 * Placeholders desconhecidos são deixados como estão (não quebra o texto
 * se o usuário escrever "{algo_que_nao_existe}").
 */
export function applyTemplate(tmpl, vars) {
  return (tmpl || '').replace(/\{(nome|primeiro_nome|data|saudacao)\}/g,
    (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

/**
 * Lê o template salvo pelo usuário (ou usa o default).
 * Retorna { subject, body } — sempre strings prontas pra uso como template.
 */
export function getEmailTemplate() {
  const saved = STORE.emailTemplate || {};
  return {
    subject: (typeof saved.subject === 'string' && saved.subject.length)
              ? saved.subject : DEFAULT_SUBJECT_TEMPLATE,
    body:    (typeof saved.body === 'string' && saved.body.length)
              ? saved.body : DEFAULT_BODY_TEMPLATE
  };
}

/**
 * Gera o deeplink do Outlook compose para enviar e-mail ao aluno faltoso.
 * Aplica o template configurado (ou o default) substituindo os placeholders.
 *
 * @param {string} email   E-mail do destinatário (aluno)
 * @param {string} nome    Nome do aluno (qualquer caixa — é capitalizado internamente)
 * @returns {string}       URL para abrir em nova aba
 */
export function buildOutlookComposeUrl(email, nome) {
  const today = new Date();
  const vars = {
    nome:           capitalizeWords(nome),
    primeiro_nome:  capitalizeWords((nome || '').split(' ')[0] || ''),
    data:           today.toLocaleDateString('pt-BR'),
    saudacao:       greetingFor(today)
  };

  const tmpl = getEmailTemplate();
  const subject = applyTemplate(tmpl.subject, vars);
  const body    = applyTemplate(tmpl.body, vars);

  // IMPORTANTE: usamos encodeURIComponent (não URLSearchParams) porque o
  // deeplink do Outlook trata "+" literalmente se codificarmos espaços
  // como "+", o assunto vira "Bom+dia" e o corpo vem todo em uma linha
  // só. encodeURIComponent gera %20 pra espaço e %0A pra quebra de linha,
  // que é o que o Outlook decodifica corretamente.
  return 'https://outlook.office.com/mail/deeplink/compose'
       + '?to='      + encodeURIComponent(email)
       + '&subject=' + encodeURIComponent(subject)
       + '&body='    + encodeURIComponent(body);
}
