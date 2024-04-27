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
        if (line.trim()) {
            const parts = line.split('\t');
            if (parts.length > 1) {
                let name = parts[0].replace('(Não verificado)', '').trim();
                if (name && name !== 'Nome' && !uniqueNames.has(name)) {
                    uniqueNames.add(name);
                    let initial = name[0].toUpperCase();
                    if (!groupedByInitial[initial]) {
                        groupedByInitial[initial] = [];
                    }
                    groupedByInitial[initial].push(name);
                }
            }
        }
    });

    displayData(groupedByInitial);
}

function displayData(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '<table>';  // Start table
    Object.keys(groupedByInitial).sort().forEach(initial => {
        const namesList = groupedByInitial[initial].map(name => `<tr><td>${name}</td></tr>`).join('');
        outputDiv.innerHTML += `<tr><th>${initial}</th></tr>${namesList}`;
    });
    outputDiv.innerHTML += '</table>';  // End table
}
