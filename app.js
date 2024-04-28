function capitalizeWords(name) {
    return name.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

document.getElementById('csvFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            processContent(content);
        };
        reader.readAsText(file, 'UTF-16'); // Lendo como UTF-16
    }
});

function processContent(content) {
    const lines = content.split(/\r?\n/);
    const groupedByInitial = {};

    lines.slice(10).forEach(line => {
        let name = line.split('\t')[0].replace(/["']+/g, '').replace(/\(Não verificado\)/, '').trim();
        name = capitalizeWords(name); // Capitaliza cada palavra do nome
        if (name && name !== 'Nome' && !name.startsWith('3.')) {
            const initial = name[0].toUpperCase();
            if (!groupedByInitial[initial]) {
                groupedByInitial[initial] = new Set(); // Usar um Set para armazenar os nomes e evitar duplicatas
            }
            groupedByInitial[initial].add(name);
        }
    });

    displayData(groupedByInitial);
}

function displayData(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; // Limpar conteúdo existente
    let tableHtml = '<table>'; // Iniciar tabela
    tableHtml += '<thead><tr><th>Inicial</th><th>Nome</th></tr></thead><tbody>'; // Adicionar cabeçalhos da tabela

    Object.keys(groupedByInitial).sort().forEach(initial => {
        Array.from(groupedByInitial[initial]).sort((a, b) => a.localeCompare(b)).forEach(name => {
            tableHtml += `<tr><td>${initial}</td><td>${name}</td></tr>`; // Adicionar linhas com inicial e nome
        });
    });

    tableHtml += '</tbody></table>'; // Finalizar tabela
    outputDiv.innerHTML = tableHtml; // Inserir a tabela na página
}
