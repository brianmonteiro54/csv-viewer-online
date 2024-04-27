document.getElementById('csvFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            processContent(content);
        };
        reader.readAsText(file, 'UTF-16');  // Lendo como UTF-16
    }
});

function processContent(content) {
    const lines = content.split(/\r?\n/);
    const participantLines = lines.slice(10);  // Pular cabeçalhos
    const uniqueNames = new Set();
    const groupedByInitial = {};

    participantLines.forEach(line => {
        // Limpar linha de aspas e espaços em branco antes de processar
        line = line.replace(/^["\s]+|["\s]+$/g, '');
        const parts = line.split('\t').map(part => part.trim()); // Dividir a linha em partes e remover espaços em branco
        if (parts.length > 1) {
            let name = parts[0].replace(/["']+/g, '').trim();  // Remover aspas do nome e espaços em branco
            name = name.replace(/\(Não verificado\)/, '').trim();  // Remover a frase "(Não verificado)"
            if (name && name !== 'Nome' && !uniqueNames.has(name)) {
                uniqueNames.add(name);
                const initial = name[0].toUpperCase();
                if (!groupedByInitial[initial]) {
                    groupedByInitial[initial] = [];
                }
                groupedByInitial[initial].push(name);
            }
        }
    });

    displayData(groupedByInitial);
}

function displayData(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    let tableHtml = '<table>';  // Start table
    tableHtml += '<thead><tr><th>Inicial</th><th>Nome</th></tr></thead><tbody>';  // Add table headers

    Object.keys(groupedByInitial).sort().forEach(initial => {
        groupedByInitial[initial].forEach(name => {
            tableHtml += `<tr><td>${initial}</td><td>${name}</td></tr>`;  // Add rows with initial and name
        });
    });

    tableHtml += '</tbody></table>';  // End table
    outputDiv.innerHTML = tableHtml;
}
