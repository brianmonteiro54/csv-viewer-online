document.getElementById('csvFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            processContent(content);
        };
        reader.readAsText(file, 'UTF-16'); // Reading as UTF-16
    }
});

function processContent(content) {
    const lines = content.split(/\r?\n/);
    const uniqueNames = new Set();
    const groupedByInitial = {};

    lines.slice(10).forEach(line => { // Skip headers
        let name = line.split('\t')[0].replace(/["']+/g, '').replace(/\(Não verificado\)/, '').trim();
        if (name && name !== 'Nome') {
            uniqueNames.add(name);
        }
    });

    Array.from(uniqueNames).sort().forEach(name => {
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
    let tableHtml = '<table>'; // Start table
    tableHtml += '<thead><tr><th>Inicial</th><th>Nome</th></tr></thead><tbody>'; // Add table headers

    Object.keys(groupedByInitial).sort().forEach(initial => {
        groupedByInitial[initial].forEach(name => {
            tableHtml += `<tr><td>${initial}</td><td>${name}</td></tr>`; // Add rows with initial and name
        });
    });

    tableHtml += '</tbody></table>'; // End table
    outputDiv.innerHTML = tableHtml;
}
