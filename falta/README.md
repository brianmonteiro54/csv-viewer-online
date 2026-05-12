# Presença - Identificador de faltas

Ferramenta para identificar rapidamente quem faltou na aula a partir do CSV exportado do Google Meet (extensão Meet Attendance).

Mesmo sistema de design do **Desempenho Acadêmico** (cores, fontes, dark mode, toasts, modais).

## Stack

- HTML5, CSS3 (variáveis CSS para temas), JavaScript moderno (ES Modules)
- Zero dependências, zero build — basta servir os arquivos estáticos
- Persistência via `localStorage` (nada vai para servidor)

## Estrutura do projeto

```
.
├── index.html              ← shell mínimo, só estrutura
├── favicon.png
│
├── css/                    ← estilos modulares (carregados em ordem)
│   ├── base.css            variáveis de tema, reset, body, helpers, animações, footer
│   ├── components.css      botões, cards, forms, dropzone, listas, modais, toasts…
│   └── layout.css          header, grid de turmas, stat grid, section heads
│
├── js/                     ← ES Modules
│   ├── main.js             entry point — boot e bindings do shell
│   ├── storage.js          STORE em memória + sync com localStorage
│   ├── theme.js            dark/light + persistência + media query do sistema
│   ├── name-matching.js    o "cérebro" — normalização, tokenização, scoring
│   ├── csv-parser.js       parsing do CSV do Meet Attendance
│   ├── router.js           navigate() + render() — SPA simples in-memory
│   ├── ui.js               escapeHtml() e toast()
│   ├── modals.js           ajuda, apelidos aprendidos, confirmação
│   └── views/
│       ├── home.js         lista de turmas
│       ├── class-form.js   criar / editar turma
│       ├── class-detail.js detalhes + upload de CSV
│       └── results.js      resultado da chamada (a view mais complexa)
│
├── .github/workflows/
│   └── deploy.yml          deploy automático para GitHub Pages
├── .nojekyll               desativa Jekyll no Pages (não filtra `_` etc)
└── .gitignore
```

## Por que ES Modules?

A separação em módulos `import`/`export` permite:
- Dependências explícitas em cada arquivo (você lê o `import` no topo e sabe o que ele usa)
- Cada módulo é testável isoladamente
- O navegador faz cache por arquivo — mudar um módulo invalida só ele
- Sem necessidade de bundler, webpack ou build step

**Atenção:** ES Modules **não funcionam ao abrir `index.html` direto com duplo-clique** (protocolo `file://` bloqueia imports por CORS). Use um servidor local — instruções abaixo.

## Rodando localmente

Qualquer servidor estático funciona. Algumas opções:

```bash
# Python (já vem instalado em macOS/Linux)
python3 -m http.server 8000

# Node (npx, sem instalar nada global)
npx serve .

# PHP
php -S localhost:8000
```



## Aprendizado contínuo

Toda vez que você confirma manualmente um caso ambíguo (ex: escolher entre dois "Brian de Almeida"), a ferramenta **aprende** a associação. No card de revisão:

1. Você escolhe um aluno no dropdown
2. O card fica verde imediatamente com badge "✓ Salvo"
3. Um toast aparece: `✓ Aprendido: "Brian de Almeida" → Brian de Almeida Monteiro`
4. Na próxima aula, esse nome entra direto em **Presentes** com tag "🧠 Lembrado"
5. Você não precisa confirmar de novo

## Como usar

1. Acesse o site (local ou GitHub Pages)
2. Clique em **"＋ Criar turma"**, dê um nome e cole a lista de alunos (um por linha)
3. Clique na turma criada
4. Arraste o CSV do Meet ou clique na zona de upload
5. Veja a chamada pronta. Se houver entradas a confirmar, escolha o aluno no dropdown
6. Use **"📋 Copiar faltas"** para copiar a lista de faltantes

## Dados

- Tudo é salvo no `localStorage` do navegador (nada vai para servidor nenhum)
- O tema (claro/escuro) é lembrado
- Para apagar uma turma: abra a turma e clique em **🗑️ Apagar turma** (ao lado de Editar lista)
- Para esquecer um apelido aprendido: **🧠 Apelidos → Esquecer**
