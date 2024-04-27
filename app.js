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

    // Processar cada linha, começando após o cabeçalho
    lines.slice(10).forEach(line => {
        let name = line.split('\t')[0].trim(); // Assumindo que o nome está na primeira coluna
        name = name.replace(/["']+/g, ''); // Remover aspas
        name = name.replace(/\(Não verificado\)/, '').trim(); // Remover sufixo (Não verificado)
        if (name && name !== 'Nome') {
            const initial = name[0].toUpperCase();
            if (!groupedByInitial[initial]) {
                groupedByInitial[initial] = new Set(); // Usar um Set para evitar nomes duplicados
            }
            groupedByInitial[initial].add(name);
        }
    });

    displayData(groupedByInitial);
}

function displayData(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '<table><thead><tr><th>Inicial</th><th>Nome</th></tr></thead><tbody>'; // Iniciar tabela

    // Ordenar as iniciais
    const sortedInitials = Object.keys(groupedByInitial).sort();

    // Ordenar os nomes dentro de cada grupo de inicial e criar as linhas da tabela
    sortedInitials.forEach(initial => {
        // Converter Set para Array e ordenar
        const namesArray = Array.from(groupedByInitial[initial]).sort();
        namesArray.forEach(name => {
            outputDiv.innerHTML += `<tr><td>${initial}</td><td>${name}</td></tr>`; // Adicionar linhas à tabela
        });
    });

    outputDiv.innerHTML += '</tbody></table>'; // Fechar tabela
}
