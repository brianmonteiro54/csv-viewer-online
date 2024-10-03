function processContent(content) {
    // Processar o conteúdo do arquivo diretamente, sem o mapa de nomes
    const lines = content.split(/\r?\n/);
    const uniqueNames = new Set();
    const groupedByInitial = {};

    // Atualizando para capturar os nomes da coluna "Nome"
    lines.slice(1).forEach(line => {
        const columns = line.split(',');
        let name = columns[0]; // Coluna 0 contém os nomes

        if (name) {
            name = name.replace(/["']+/g, '').trim();  // Remove aspas duplas e espaços
            name = capitalizeWords(name);  // Capitaliza as palavras

            const normalizedName = normalizeName(name);

            // Remove "Anonimos" e "Brian Richard Ribeiro Monteiro"
            if (normalizedName !== normalizeName('Anonimos') && normalizedName !== normalizeName('Brian Richard Ribeiro Monteiro')) {
                if (normalizedName) {
                    uniqueNames.add(name);
                }
            }
        }
    });

    Array.from(uniqueNames).sort((a, b) => a.localeCompare(b)).forEach(name => {
        const initial = name[0].toUpperCase();
        if (!groupedByInitial[initial]) {
            groupedByInitial[initial] = [];
        }
        groupedByInitial[initial].push(name);
    });

    displayData(groupedByInitial);
}

function normalizeName(name) {
    return name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function capitalizeWords(name) {
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
