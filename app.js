
document.getElementById('csvFileInput').addEventListener('change', function(event) {
    Papa.parse(event.target.files[0], {
        complete: function(results) {
            processData(results.data);
        }
    });
});

function processData(data) {
    let uniqueNames = new Set();
    let groupedByInitial = {};

    data.forEach(row => {
        let name = row[0].replace('(Não verificado)', '').trim();  // Assuming names are in the first column
        if (!uniqueNames.has(name)) {
            uniqueNames.add(name);
            let initial = name[0].toUpperCase();
            if (!groupedByInitial[initial]) {
                groupedByInitial[initial] = [];
            }
            groupedByInitial[initial].push(name);
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
