document.getElementById('csvFileInput').addEventListener('change', function(event) {
    Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            processData(results.data);
        }
    });
});

function processData(data) {
    let uniqueNames = new Set();
    let groupedByInitial = {};

    data.forEach(row => {
        // Detectando a coluna correta para 'Nome'
        let nameColumn = Object.keys(row).find(key => key.toLowerCase().includes('nome'));
        if (nameColumn) {
            let name = row[nameColumn].replace('(Não verificado)', '').trim();
            if (!uniqueNames.has(name)) {
                uniqueNames.add(name);
                let initial = name[0].toUpperCase();
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
    outputDiv.innerHTML = '';  // Clear previous data
    Object.keys(groupedByInitial).sort().forEach(initial => {
        const namesList = groupedByInitial[initial].join('<br>');
        outputDiv.innerHTML += `<h2>${initial}</h2><p>${namesList}</p>`;
    });
}
