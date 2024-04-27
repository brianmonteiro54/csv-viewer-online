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

    lines.slice(10) // Skip headers and other non-name rows
        .map(line => line.split('\t')[0].trim()) // Assume name is in the first column
        .filter(name => name && !name.startsWith('3.') && name !== 'Nome') // Filter out unwanted rows
        .forEach(name => {
            name = name.replace(/["']+/g, '').replace(/\(Não verificado\)/, '').trim();
            if (!uniqueNames.has(name)) {
                uniqueNames.add(name);
                const initial = name[0].toUpperCase();
                if (!groupedByInitial[initial]) {
                    groupedByInitial[initial] = [];
                }
                groupedByInitial[initial].push(name);
            }
        });

    // Sort names within each group
    for (const initial in groupedByInitial) {
        groupedByInitial[initial].sort((a, b) => a.localeCompare(b));
    }

    displayData(groupedByInitial);
}

function displayData(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; // Clear any existing content
    let tableHtml = '<table>'; // Start table
    tableHtml += '<thead><tr><th>Inicial</th><th>Nome</th></tr></thead><tbody>'; // Add table headers

    // Sort initials and iterate over them
    Object.keys(groupedByInitial).sort().forEach(initial => {
        groupedByInitial[initial].forEach(name => {
            tableHtml += `<tr><td>${initial}</td><td>${name}</td></tr>`; // Add rows with initial and name
        });
    });

    tableHtml += '</tbody></table>'; // End table
    outputDiv.innerHTML = tableHtml; // Insert the table into the page
}
