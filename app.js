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

function capitalizeWords(name) {
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

function processContent(content) {
    const lines = content.split(/\r?\n/);
    const uniqueNames = new Set();
    const groupedByInitial = {};

    lines.slice(10).forEach(line => {
        if (!line.startsWith('3.')) {  // Verifica se a linha não começa com "3."
            let name = line.split('\t')[0].replace(/["']+/g, '')
                                         .replace(/\(Não verificado\)/gi, '')
                                         .replace(/\(unverified\)/gi, '')
                                         .replace(/Name/gi, '') // Remove 'Name' de forma insensível a maiúsculas e minúsculas
                                         .replace(/\(convidado\)/gi, '') // Remove '(convidado)' de forma insensível a maiúsculas e minúsculas
                                         .replace(/\(guest\)/gi, '') // Remove '(guest)' de forma insensível a maiúsculas e minúsculas
                                         .trim();
            name = capitalizeWords(name);  // Capitaliza cada palavra do nome
            if (name && name !== 'Nome' && name !== 'Name') {
                uniqueNames.add(name);
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

function displayData(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; //Limpa os dados anteriores
    let tableHtml = '<table>'; //Iniciar tabela
    tableHtml += `<thead><tr><th>Inicial</th><th>Nomes <button id="copyButton" class="tooltip">&#x1f4cb;<span class="tooltiptext">Copiar</span></button></th></tr></thead><tbody>`; // Add copy button to header

    Object.keys(groupedByInitial).sort().forEach(initial => {
        tableHtml += `<tr><td>${initial}</td><td>${groupedByInitial[initial].join('<br>')}</td></tr>`; // Add names in the same cell
    });

    tableHtml += '</tbody></table>'; // Finalizar tabela
    outputDiv.innerHTML = tableHtml; // Insira a tabela na página

    // Configura a funcionalidade do botão de cópia
    document.getElementById('copyButton').addEventListener('click', function() {
        copyNamesToClipboard(groupedByInitial);
    });
}

function copyNamesToClipboard(groupedByInitial) {
    const allNames = Object.values(groupedByInitial).flat().join('\n');
    navigator.clipboard.writeText(allNames).then(() => {
        alert('Nomes copiados para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar nomes: ', err);
    });
}
