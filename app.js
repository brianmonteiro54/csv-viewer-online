document.getElementById('csvFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('output').innerHTML = '<p>Carregando arquivo...</p>';
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                processData(results.data);
            }
        });
    }
});

function processData(data) {
    let uniqueNames = new Set();
    let groupedByInitial = {};

    data.forEach(row => {
        // Encontrando a coluna de nomes
        let nameColumn = Object.keys(row).find(key => key.toLowerCase().includes('nome'));
        if (nameColumn) {
            let names = row[nameColumn].split(';').map(name => name.replace('(Não verificado)', '').trim());
            names.forEach(name => {
                if (!uniqueNames.has(name)) {
                    uniqueNames.add(name);
                    let initial = name[0].toUpperCase();
                    if (!groupedByInitial[initial]) {
                        groupedByInitial[initial] = [];
                    }
                    groupedByInitial[initial].push(name);
                }
            });
        }
    });

    displayData(groupedByInitial);
}

function displayData(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';  // Clear previous data
    if (Object.keys(groupedByInitial).length === 0) {
        outputDiv.innerHTML = '<p>Nenhum dado válido encontrado.</p>';
    } else {
        Object.keys(groupedByInitial).sort().forEach(initial => {
            const namesList = groupedByInitial[initial].join('<br>');
            outputDiv.innerHTML += `<h2>${initial}</h2><p>${namesList}</p>`;
        });
    }
}
