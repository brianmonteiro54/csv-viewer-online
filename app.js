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
    const uniqueNamesSet = new Set(); // Usar um Set para manter os nomes únicos
    const groupedByInitial = {};

    lines.slice(10).forEach(line => { // Pular cabeçalhos
        const name = line.split('\t')[0]
                        .replace(/["']+/g, '')
                        .replace(/\(Não verificado\)/, '')
                        .trim();
        if (name && name !== 'Nome') {
            uniqueNamesSet.add(name);
        }
    });

    // Converter o Set em Array para poder ordenar
    const uniqueNames = Array.from(uniqueNamesSet).sort((a, b) => a.localeCompare(b));

    // Agrupar os nomes únicos por sua inicial
    uniqueNames.forEach(name => {
        const initial = name[0].toUpperCase();
        if (!groupedByInitial[initial]) {
            groupedByInitial[initial] = [];
        }
        groupedByInitial[initial].push(name);
    });

    displayData(groupedByInitial);
}

function displayData(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '<table><thead><tr><th>Inicial</th><th>Nome</th></tr></thead><tbody>'; // Start table and add headers

    Object.keys(groupedByInitial).sort().forEach(initial => {
        groupedByInitial[initial].forEach(name => {
            outputDiv.innerHTML += `<tr><td>${initial}</td><td>${name}</td></tr>`; // Add rows with initial and name
        });
    });

    outputDiv.innerHTML += '</tbody></table>'; // End table
}
